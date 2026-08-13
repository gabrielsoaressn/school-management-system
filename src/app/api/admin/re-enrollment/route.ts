import { z } from "zod";
import { withAuth } from "@/lib/api-auth";
import { fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { previewReEnrollment, runReEnrollment } from "@/lib/re-enrollment";
import { recordAudit } from "@/lib/audit";

const previewSchema = z.object({
  fromYear: z.coerce.number().int().min(2000).max(2100),
  toYear: z.coerce.number().int().min(2000).max(2100),
  retainedStudentIds: z.array(z.string()).optional(),
});

const runSchema = previewSchema.extend({
  /** Guard against an accidental POST: the caller states the intent. */
  confirm: z.literal(true),
  createTargetYear: z.boolean().optional(),
  cloneClasses: z.boolean().optional(),
  issueCharges: z.boolean().optional(),
});

/**
 * GET /api/admin/re-enrollment?fromYear=2026&toYear=2027
 *
 * Dry run: what would happen to each student, and why. Nothing is written, so
 * the school can review the list — and mark who repeats — before committing.
 */
export const GET = withAuth(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);

      const parsed = previewSchema.safeParse({
        fromYear: searchParams.get("fromYear"),
        toYear: searchParams.get("toYear"),
        retainedStudentIds:
          searchParams.get("retained")?.split(",").filter(Boolean) ?? undefined,
      });

      if (!parsed.success) {
        return validationFailed(parsed.error);
      }

      if (parsed.data.toYear <= parsed.data.fromYear) {
        return fail("O ano de destino deve ser posterior ao ano de origem");
      }

      const preview = await previewReEnrollment(parsed.data);

      return ok(preview);
    } catch (error) {
      return serverError(error, "Erro ao simular a rematrícula");
    }
  },
  { permission: "enrollment:read" }
);

/**
 * POST /api/admin/re-enrollment
 *
 * Runs the promotion. Idempotent per student: anyone already enrolled in the
 * target year is skipped, so a partial run can be repeated safely.
 */
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = runSchema.parse(body);

      if (parsed.toYear <= parsed.fromYear) {
        return fail("O ano de destino deve ser posterior ao ano de origem");
      }

      const result = await runReEnrollment(parsed);

      await recordAudit({
        action: "enrollment.re_enroll",
        entity: "AcademicYear",
        actor: user,
        request,
        after: {
          fromYear: parsed.fromYear,
          ...result,
          retainedStudentIds: parsed.retainedStudentIds ?? [],
        },
      });

      return ok(result, {
        message:
          `${result.classesCreated} turma(s) criada(s), ` +
          `${result.enrolled} aluno(s) promovido(s), ${result.retained} retido(s), ` +
          `${result.graduating} concluinte(s), ${result.chargesCreated} cobrança(s) gerada(s)`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao executar a rematrícula");
    }
  },
  { permission: "enrollment:write" }
);
