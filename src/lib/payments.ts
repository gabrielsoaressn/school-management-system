import { Prisma, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ZERO, subtract, sum, toCents, type MoneyInput } from "@/lib/money";
import { isOverdue } from "@/lib/billing-rules";

/**
 * Billing.status is derived from the payments received, never set by hand.
 *
 * The column stays (every listing filters on it), but only this module writes
 * it, so "paid" can never disagree with the receipts.
 */

/**
 * The client or a transaction client, derived from the extended client so the
 * soft-delete extension does not break the type.
 */
type DbClient =
  | typeof prisma
  | Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** States decided by a person, which payments must not override. */
const MANUAL_STATES: PaymentStatus[] = ["DRAFT", "CANCELLED", "RENEGOTIATED"];

export interface StatusInput {
  amount: MoneyInput;
  dueDate: Date | string;
  currentStatus: PaymentStatus;
}

export function resolveBillingStatus(
  { amount, dueDate, currentStatus }: StatusInput,
  paidTotal: MoneyInput,
  referenceDate: Date = new Date()
): PaymentStatus {
  if (MANUAL_STATES.includes(currentStatus)) {
    return currentStatus;
  }

  const total = toCents(amount);
  const paid = toCents(paidTotal);

  if (paid.greaterThanOrEqualTo(total) && !total.isZero()) {
    return "PAID";
  }

  if (paid.greaterThan(ZERO)) {
    return "PARTIALLY_PAID";
  }

  return isOverdue({ dueDate, status: "PENDING" }, referenceDate)
    ? "OVERDUE"
    : "PENDING";
}

export interface BillingBalance {
  amount: Prisma.Decimal;
  paid: Prisma.Decimal;
  outstanding: Prisma.Decimal;
  status: PaymentStatus;
}

/** Recomputes status and paidDate from the receipts, and persists both. */
export async function recalculateBillingStatus(
  billingId: string,
  client: DbClient = prisma,
  referenceDate: Date = new Date()
): Promise<BillingBalance> {
  const billing = await client.billing.findUnique({
    where: { id: billingId },
    include: { payments: { orderBy: { paidAt: "asc" } } },
  });

  if (!billing) {
    throw new Error(`Cobrança ${billingId} não encontrada`);
  }

  const paid = sum(billing.payments.map((payment) => payment.amount));
  const status = resolveBillingStatus(
    {
      amount: billing.amount,
      dueDate: billing.dueDate,
      currentStatus: billing.status,
    },
    paid,
    referenceDate
  );

  // paidDate is the date the charge was settled: the last payment that
  // completed it, or null while it is still short.
  const paidDate =
    status === "PAID" && billing.payments.length > 0
      ? billing.payments[billing.payments.length - 1].paidAt
      : null;

  if (status !== billing.status || billing.paidDate?.getTime() !== paidDate?.getTime()) {
    await client.billing.update({
      where: { id: billingId },
      data: { status, paidDate },
    });
  }

  return {
    amount: toCents(billing.amount),
    paid,
    outstanding: Prisma.Decimal.max(subtract(billing.amount, paid), ZERO),
    status,
  };
}
