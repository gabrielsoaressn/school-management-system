import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { withoutAuth } from "@/lib/api-auth";
import { fail, ok, serverError } from "@/lib/api-response";
import { computeNextBillingDate } from "@/lib/billing-rules";
import { nextInvoiceNumber } from "@/lib/identifiers";
import { startOfToday } from "@/lib/datetime";
import { recordAudit } from "@/lib/audit";

/**
 * POST /api/cron/daily
 *
 * The one scheduled routine. Authenticated by the CRON_SECRET header, not by a
 * session, because it is called by the scheduler. See docs/OPERATIONS.md.
 *
 * Idempotent by construction: running it twice on the same day changes nothing
 * the second time.
 *  - overdue: an UPDATE with a WHERE that no longer matches after the first run
 *  - recurrence: each charge advances its own nextBillingDate, so the second
 *    run finds nothing due
 */

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET não configurado; requisição recusada");
    return false;
  }

  const provided = request.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST = withoutAuth(async (request) => {
  try {
    if (!authorized(request)) {
      return fail("Não autorizado", 401);
    }

    const today = startOfToday();
    const startedAt = new Date();

    // 1. Charges past their due date become OVERDUE. PARTIALLY_PAID is left
    // alone: it already tells the truth and is more informative.
    const overdue = await prisma.billing.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: today },
      },
      data: { status: "OVERDUE" },
    });

    // 2. Recurring charges due for their next instalment.
    const recurring = await prisma.billing.findMany({
      where: {
        isRecurring: true,
        recurrence: { not: "NONE" },
        nextBillingDate: { lte: today },
      },
    });

    const generated: string[] = [];
    const failed: { invoiceNumber: string; error: string }[] = [];

    for (const billing of recurring) {
      try {
        const dueDate = billing.nextBillingDate!;
        const invoiceNumber = await nextInvoiceNumber();

        await prisma.$transaction(async (tx) => {
          await tx.billing.create({
            data: {
              invoiceNumber,
              parentId: billing.parentId,
              type: billing.type,
              description: billing.description,
              amount: billing.amount,
              dueDate,
              status: "PENDING",
              // The generated instalment is not itself the series head.
              isRecurring: false,
              recurrence: "NONE",
              nextBillingDate: null,
              notes: `Gerado automaticamente de ${billing.invoiceNumber}`,
            },
          });

          await tx.billing.update({
            where: { id: billing.id },
            data: {
              nextBillingDate: computeNextBillingDate(
                dueDate,
                billing.recurrence
              ),
            },
          });
        });

        generated.push(invoiceNumber);
      } catch (error) {
        failed.push({
          invoiceNumber: billing.invoiceNumber,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    const summary = {
      startedAt,
      markedOverdue: overdue.count,
      recurringGenerated: generated.length,
      recurringFailed: failed.length,
      invoices: generated,
      failures: failed,
    };

    await recordAudit({
      action: "cron.daily",
      entity: "Billing",
      request,
      after: summary,
    });

    return ok(summary, {
      message:
        `${overdue.count} cobrança(s) marcada(s) como vencida(s), ` +
        `${generated.length} recorrência(s) gerada(s)`,
    });
  } catch (error) {
    return serverError(error, "Erro ao executar rotina diária");
  }
});
