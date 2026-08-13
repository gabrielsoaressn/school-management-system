import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import {
  created,
  fail,
  notFound,
  ok,
  serverError,
  validationFailed,
} from "@/lib/api-response";
import { recordAudit } from "@/lib/audit";
import { recalculateBillingStatus } from "@/lib/payments";
import { computeAmountDue, loadLateChargeSettings } from "@/lib/billing-rules";
import { parseDate } from "@/lib/datetime";
import { toCents } from "@/lib/money";

const paymentSchema = z.object({
  amount: z.union([z.number(), z.string()]),
  paidAt: z.string(),
  method: z.enum(["PIX", "BOLETO", "CARD", "CASH", "TRANSFER"]),
  notes: z.string().optional(),
  externalId: z.string().optional(),
});

/** GET — receipts of a charge, with the outstanding balance. */
export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    try {
      const { id } = await params;

      const billing = await prisma.billing.findUnique({
        where: { id },
        include: { payments: { orderBy: { paidAt: "desc" } } },
      });

      if (!billing) {
        return notFound("Cobrança não encontrada");
      }

      const settings = await loadLateChargeSettings();
      const dueNow = computeAmountDue(billing, new Date(), settings);
      const balance = await recalculateBillingStatus(id);

      return ok({
        payments: billing.payments,
        balance: {
          principal: dueNow.principal,
          fine: dueNow.fine,
          interest: dueNow.interest,
          totalDue: dueNow.total,
          paid: balance.paid,
          outstanding: balance.outstanding,
          daysLate: dueNow.daysLate,
        },
        status: balance.status,
      });
    } catch (error) {
      return serverError(error, "Erro ao buscar pagamentos");
    }
  },
  { permission: "billing:read" }
);

/**
 * POST — registers a payment, in full or in part.
 *
 * The charge's status is recomputed from the receipts inside the same
 * transaction, so a partial payment can never leave it marked PAID.
 */
export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const data = paymentSchema.parse(body);

      const amount = toCents(data.amount);

      if (!amount.greaterThan(0)) {
        return fail("O valor do pagamento deve ser maior que zero");
      }

      const billing = await prisma.billing.findUnique({ where: { id } });

      if (!billing) {
        return notFound("Cobrança não encontrada");
      }

      if (billing.status === "CANCELLED") {
        return fail("Não é possível registrar pagamento em cobrança cancelada");
      }

      if (billing.status === "DRAFT") {
        return fail("Aprove a cobrança antes de registrar o pagamento");
      }

      if (data.externalId) {
        const existing = await prisma.payment.findUnique({
          where: { externalId: data.externalId },
        });

        // A replayed provider webhook is a no-op, not a second receipt.
        if (existing) {
          return ok(existing, { message: "Pagamento já registrado" });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            billingId: id,
            amount,
            paidAt: parseDate(data.paidAt),
            method: data.method,
            receivedBy: user.email,
            notes: data.notes ?? null,
            externalId: data.externalId ?? null,
          },
        });

        const balance = await recalculateBillingStatus(id, tx);

        return { payment, balance };
      });

      await recordAudit({
        action: "billing.payment",
        entity: "Billing",
        entityId: id,
        actor: user,
        request,
        before: { status: billing.status },
        after: {
          paymentId: result.payment.id,
          amount: result.payment.amount,
          method: result.payment.method,
          status: result.balance.status,
          outstanding: result.balance.outstanding,
        },
      });

      const settled = result.balance.outstanding.isZero();

      return created(result, {
        message: settled
          ? "Pagamento registrado. Cobrança quitada."
          : `Pagamento registrado. Saldo em aberto: R$ ${result.balance.outstanding.toFixed(2)}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao registrar pagamento");
    }
  },
  { permission: "billing:write" }
);
