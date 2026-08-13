import { Prisma, type PaymentStatus, type RecurrenceType } from "@prisma/client";
import { ZERO, percentOf, toCents, toDecimal, type MoneyInput } from "@/lib/money";
import { addMonths, addYears, daysOverdue, startOfToday } from "@/lib/datetime";
import { getSettingAsNumber } from "@/lib/settings";

/**
 * The one place that decides how much a charge is worth today.
 *
 * Late fee and interest were configurable in Settings from the start and read
 * by nothing: the collection screen and the guardian's portal both showed the
 * bare principal, which is not what the school is owed.
 *
 * Convention used in Brazil for school tuition: a one-off fine as a percentage
 * of the principal, plus simple interest per day of delay (0.033%/day ≈ 1% a
 * month), counted from the day after the due date.
 */

export interface LateChargeSettings {
  /** Percentage of the principal, charged once. Default 2%. */
  finePercentage: Prisma.Decimal;
  /** Percentage of the principal per day late. Default 0.033%. */
  dailyInterestPercentage: Prisma.Decimal;
}

export const DEFAULT_LATE_CHARGES: LateChargeSettings = {
  finePercentage: new Prisma.Decimal(2),
  dailyInterestPercentage: new Prisma.Decimal(0.033),
};

/** Reads the school's configured fine and interest from Settings. */
export async function loadLateChargeSettings(): Promise<LateChargeSettings> {
  const [fine, interest] = await Promise.all([
    getSettingAsNumber("late_payment_fine_percentage", 2),
    getSettingAsNumber("late_payment_interest_daily", 0.033),
  ]);

  return {
    finePercentage: toDecimal(fine),
    dailyInterestPercentage: toDecimal(interest),
  };
}

export interface ChargeInput {
  amount: MoneyInput;
  dueDate: Date | string;
  status: PaymentStatus;
}

export interface AmountDue {
  principal: Prisma.Decimal;
  fine: Prisma.Decimal;
  interest: Prisma.Decimal;
  total: Prisma.Decimal;
  daysLate: number;
}

/** Statuses that never accrue late charges. */
const SETTLED: PaymentStatus[] = ["PAID", "CANCELLED", "DRAFT"];

/**
 * Principal plus fine plus interest as of `referenceDate`, with the parts
 * itemized so a screen can show the composition instead of a single number.
 */
export function computeAmountDue(
  charge: ChargeInput,
  referenceDate: Date = new Date(),
  settings: LateChargeSettings = DEFAULT_LATE_CHARGES
): AmountDue {
  const principal = toCents(charge.amount);

  if (SETTLED.includes(charge.status)) {
    return { principal, fine: ZERO, interest: ZERO, total: principal, daysLate: 0 };
  }

  const daysLate = daysOverdue(charge.dueDate, referenceDate);

  if (daysLate <= 0) {
    return { principal, fine: ZERO, interest: ZERO, total: principal, daysLate: 0 };
  }

  const fine = percentOf(principal, settings.finePercentage);
  // Apply the accumulated rate once and round at the end. Rounding the daily
  // amount first and multiplying inflates the charge: 0.033% of 1500,00 is
  // 0,495 -> 0,50 per day -> 5,00 in ten days, instead of the correct 4,95.
  const interest = percentOf(
    principal,
    settings.dailyInterestPercentage.times(daysLate)
  );

  return {
    principal,
    fine,
    interest,
    total: toCents(principal.plus(fine).plus(interest)),
    daysLate,
  };
}

/** True when a charge should move to OVERDUE as of `referenceDate`. */
export function isOverdue(
  charge: Pick<ChargeInput, "dueDate" | "status">,
  referenceDate: Date = new Date()
): boolean {
  if (charge.status !== "PENDING") return false;
  return startOfToday(referenceDate).getTime() > new Date(charge.dueDate).getTime();
}

/**
 * When the next charge of a recurring series falls due.
 *
 * Shared by the student enrolment flow and the daily recurrence job: they used
 * to compute this separately, and the enrolment side simply forgot to, which
 * left every generated tuition invisible to the job.
 */
export function computeNextBillingDate(
  dueDate: Date,
  recurrence: RecurrenceType
): Date | null {
  switch (recurrence) {
    case "MONTHLY":
      return addMonths(dueDate, 1);
    case "QUARTERLY":
      return addMonths(dueDate, 3);
    case "ANNUALLY":
      return addYears(dueDate, 1);
    case "NONE":
    default:
      return null;
  }
}
