import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import type { AuthenticatedUser } from "@/lib/api-auth";

/**
 * Audit trail for privileged operations (LGPD art. 37: records of processing).
 *
 * Append-only and best-effort: a logging failure must never fail the operation
 * the user asked for, so errors are logged and swallowed. The row keeps the
 * actor's e-mail and role as text, so the entry stays readable even if the
 * account is later removed.
 */

export type AuditAction =
  | "billing.approve"
  | "billing.reject"
  | "billing.approve_all"
  | "billing.create"
  | "billing.update"
  | "billing.delete"
  | "billing.renegotiate"
  | "billing.payment"
  | "billing.remind"
  | "payroll.create"
  | "payroll.update"
  | "payroll.delete"
  | "student.create"
  | "student.update"
  | "student.delete"
  | "parent.create"
  | "parent.update"
  | "parent.delete"
  | "employee.create"
  | "employee.update"
  | "employee.delete"
  | "enrollment.approve"
  | "enrollment.reject"
  | "enrollment.cancel"
  | "enrollment.re_enroll"
  | "document.generate"
  | "settings.update"
  | "password.change"
  | "cpf_list.access"
  | "data_subject_request.create"
  | "cron.daily";

interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  actor?: AuthenticatedUser | null;
  before?: unknown;
  after?: unknown;
  request?: Request;
}

/** Fields we never copy into before/after snapshots. */
const SNAPSHOT_DENYLIST = new Set(["password", "tokenHash"]);

function snapshot(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(snapshot);

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SNAPSHOT_DENYLIST.has(key)) continue;
    out[key] = snapshot(nested);
  }
  return out;
}

export async function recordAudit({
  action,
  entity,
  entityId,
  actor,
  before,
  after,
  request,
}: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId ?? null,
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        actorRole: actor?.role ?? null,
        before: (snapshot(before) ?? null) as never,
        after: (snapshot(after) ?? null) as never,
        ip: request ? clientIp(request) : null,
      },
    });
  } catch (error) {
    console.error("[audit] falha ao registrar", action, entity, entityId, error);
  }
}

/**
 * Records that someone listed records containing CPF. Deliberately coarse: the
 * filters, not the rows, so the trail does not become a second copy of the data.
 */
export async function recordCpfListAccess({
  entity,
  actor,
  request,
  filters,
}: {
  entity: string;
  actor: AuthenticatedUser;
  request: Request;
  filters?: Record<string, unknown>;
}): Promise<void> {
  await recordAudit({
    action: "cpf_list.access",
    entity,
    actor,
    request,
    after: filters,
  });
}
