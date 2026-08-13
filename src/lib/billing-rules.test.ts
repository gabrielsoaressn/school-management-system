import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_LATE_CHARGES,
  computeAmountDue,
  computeNextBillingDate,
  isOverdue,
} from "./billing-rules";
import { schoolDate } from "./datetime";

const due = schoolDate(2026, 8, 10);

describe("computeAmountDue", () => {
  it("charges only the principal before the due date", () => {
    const result = computeAmountDue(
      { amount: 1500, dueDate: due, status: "PENDING" },
      schoolDate(2026, 8, 9)
    );

    expect(result.total.toFixed(2)).toBe("1500.00");
    expect(result.fine.isZero()).toBe(true);
    expect(result.interest.isZero()).toBe(true);
    expect(result.daysLate).toBe(0);
  });

  it("charges only the principal on the due date itself", () => {
    const result = computeAmountDue(
      { amount: 1500, dueDate: due, status: "PENDING" },
      schoolDate(2026, 8, 10, 23, 0)
    );

    expect(result.total.toFixed(2)).toBe("1500.00");
    expect(result.daysLate).toBe(0);
  });

  it("adds a one-off fine and daily interest once late", () => {
    // 10 days late: fine 2% = 30.00, interest 0.033%/day = 0.495 * 10 = 4.95
    const result = computeAmountDue(
      { amount: 1500, dueDate: due, status: "OVERDUE" },
      schoolDate(2026, 8, 20)
    );

    expect(result.daysLate).toBe(10);
    expect(result.fine.toFixed(2)).toBe("30.00");
    expect(result.interest.toFixed(2)).toBe("4.95");
    expect(result.total.toFixed(2)).toBe("1534.95");
  });

  it("keeps the fine flat while interest grows with time", () => {
    const tenDays = computeAmountDue(
      { amount: 1000, dueDate: due, status: "OVERDUE" },
      schoolDate(2026, 8, 20)
    );
    const twentyDays = computeAmountDue(
      { amount: 1000, dueDate: due, status: "OVERDUE" },
      schoolDate(2026, 8, 30)
    );

    expect(tenDays.fine.equals(twentyDays.fine)).toBe(true);
    expect(twentyDays.interest.equals(tenDays.interest.times(2))).toBe(true);
  });

  it("never charges interest on a settled invoice", () => {
    for (const status of ["PAID", "CANCELLED", "DRAFT"] as const) {
      const result = computeAmountDue(
        { amount: 1500, dueDate: due, status },
        schoolDate(2027, 1, 1)
      );

      expect(result.total.toFixed(2)).toBe("1500.00");
      expect(result.daysLate).toBe(0);
    }
  });

  it("respects the school's configured fine and interest", () => {
    const result = computeAmountDue(
      { amount: 2000, dueDate: due, status: "OVERDUE" },
      schoolDate(2026, 8, 15),
      {
        finePercentage: new Prisma.Decimal(5),
        dailyInterestPercentage: new Prisma.Decimal(0.1),
      }
    );

    expect(result.fine.toFixed(2)).toBe("100.00");
    expect(result.interest.toFixed(2)).toBe("10.00");
    expect(result.total.toFixed(2)).toBe("2110.00");
  });

  it("keeps cents exact where floats would drift", () => {
    const result = computeAmountDue(
      { amount: "0.10", dueDate: due, status: "OVERDUE" },
      schoolDate(2026, 8, 11),
      {
        finePercentage: new Prisma.Decimal(20),
        dailyInterestPercentage: DEFAULT_LATE_CHARGES.dailyInterestPercentage,
      }
    );

    // 0.10 + 0.02 fine, interest rounds to zero cents
    expect(result.total.toFixed(2)).toBe("0.12");
  });
});

describe("isOverdue", () => {
  it("is false on the due date and true the day after", () => {
    const charge = { dueDate: due, status: "PENDING" as const };

    expect(isOverdue(charge, schoolDate(2026, 8, 10, 23, 59))).toBe(false);
    expect(isOverdue(charge, schoolDate(2026, 8, 11, 0, 1))).toBe(true);
  });

  it("only applies to pending charges", () => {
    expect(isOverdue({ dueDate: due, status: "PAID" }, schoolDate(2027, 1, 1))).toBe(
      false
    );
  });
});

describe("computeNextBillingDate", () => {
  it("advances by the recurrence period", () => {
    expect(computeNextBillingDate(due, "MONTHLY")?.toISOString()).toBe(
      schoolDate(2026, 9, 10).toISOString()
    );
    expect(computeNextBillingDate(due, "QUARTERLY")?.toISOString()).toBe(
      schoolDate(2026, 11, 10).toISOString()
    );
    expect(computeNextBillingDate(due, "ANNUALLY")?.toISOString()).toBe(
      schoolDate(2027, 8, 10).toISOString()
    );
  });

  it("returns null when there is no recurrence", () => {
    expect(computeNextBillingDate(due, "NONE")).toBeNull();
  });

  it("clamps to the last day of a shorter month", () => {
    // 31 January + 1 month is 28 February, not 3 March
    const next = computeNextBillingDate(schoolDate(2026, 1, 31), "MONTHLY");
    expect(next?.toISOString()).toBe(schoolDate(2026, 2, 28).toISOString());
  });
});
