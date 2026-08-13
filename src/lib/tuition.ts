import { Prisma } from "@prisma/client";
import { ZERO, percentOf, subtract, toCents, toDecimal, type MoneyInput } from "@/lib/money";
import { addMonths, currentSchoolMonth, schoolDate, startOfToday } from "@/lib/datetime";
import { computeNextBillingDate } from "@/lib/billing-rules";

/**
 * Builds the recurring tuition charge created when a student is enrolled.
 *
 * Pure and separate from the route so the rules — discount, due day rollover,
 * and the recurrence pointer — can be tested without a database.
 */

/**
 * Kind of ad-hoc discount granted when a tuition charge is created. Not a
 * Prisma enum: the discount is a request parameter, recorded in the charge note,
 * not a stored column. (The Discount coupon model was legacy — see BACKLOG for
 * the structural version.)
 */
export type DiscountKind = "PERCENTAGE" | "FIXED_AMOUNT";

export interface TuitionChargeInput {
  baseAmount: MoneyInput;
  /** Day of the month the school bills on (Settings: billing_due_day). */
  dueDay: number;
  discount?: {
    type: DiscountKind;
    value: MoneyInput;
  } | null;
  /** Defaults to now; injectable so tests are not tied to the calendar. */
  referenceDate?: Date;
}

export interface TuitionCharge {
  amount: Prisma.Decimal;
  dueDate: Date;
  nextBillingDate: Date;
  discountApplied: Prisma.Decimal;
}

export function buildTuitionCharge({
  baseAmount,
  dueDay,
  discount,
  referenceDate = new Date(),
}: TuitionChargeInput): TuitionCharge {
  const base = toCents(baseAmount);

  let discountApplied = ZERO;
  if (discount && !toDecimal(discount.value).isZero()) {
    discountApplied =
      discount.type === "PERCENTAGE"
        ? percentOf(base, discount.value)
        : toCents(discount.value);
  }

  // A discount never turns into a credit.
  const amount = toCents(
    Prisma.Decimal.max(subtract(base, discountApplied), ZERO)
  );

  const dueDate = resolveFirstDueDate(dueDay, referenceDate);

  return {
    amount,
    dueDate,
    // MONTHLY tuition: without this the daily recurrence job, which filters on
    // nextBillingDate, never sees the charge and no second instalment is ever
    // generated.
    nextBillingDate: computeNextBillingDate(dueDate, "MONTHLY")!,
    discountApplied,
  };
}

/**
 * First due date: this month's billing day, or next month's if that day has
 * already passed. Clamped to the last day of short months, so a school billing
 * on the 31st still charges in February.
 */
export function resolveFirstDueDate(dueDay: number, referenceDate: Date): Date {
  const { year, month } = currentSchoolMonth(referenceDate);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const thisMonth = schoolDate(year, month, Math.min(dueDay, lastDayOfMonth));

  if (thisMonth.getTime() >= startOfToday(referenceDate).getTime()) {
    return thisMonth;
  }

  return addMonths(thisMonth, 1);
}

/** Note recorded on the charge, so the approval screen shows why the value differs. */
export function tuitionChargeNote(charge: TuitionCharge, discount?: {
  type: DiscountKind;
  value: MoneyInput;
} | null): string {
  const pending = "Aguardando aprovação do administrador";

  if (!discount || charge.discountApplied.isZero()) {
    return pending;
  }

  const description =
    discount.type === "PERCENTAGE"
      ? `${toDecimal(discount.value).toString()}%`
      : `R$ ${toCents(discount.value).toFixed(2)}`;

  return `Desconto aplicado: ${description} | ${pending}`;
}
