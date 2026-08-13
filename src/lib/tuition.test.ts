import { describe, expect, it } from "vitest";
import { buildTuitionCharge, resolveFirstDueDate } from "./tuition";
import { schoolDate } from "./datetime";

describe("buildTuitionCharge", () => {
  it("always sets nextBillingDate one month after the due date", () => {
    // Regression: the enrolment flow created the charge with isRecurring: true
    // and recurrence MONTHLY but left nextBillingDate null. The recurrence job
    // filters on `nextBillingDate <= today`, and null never matches, so the
    // second instalment of every student was never generated.
    const charge = buildTuitionCharge({
      baseAmount: 1500,
      dueDay: 10,
      referenceDate: schoolDate(2026, 8, 5),
    });

    expect(charge.dueDate.toISOString()).toBe(schoolDate(2026, 8, 10).toISOString());
    expect(charge.nextBillingDate).not.toBeNull();
    expect(charge.nextBillingDate.toISOString()).toBe(
      schoolDate(2026, 9, 10).toISOString()
    );
  });

  it("uses the base amount when there is no discount", () => {
    const charge = buildTuitionCharge({
      baseAmount: 1500,
      dueDay: 10,
      referenceDate: schoolDate(2026, 8, 1),
    });

    expect(charge.amount.toFixed(2)).toBe("1500.00");
    expect(charge.discountApplied.isZero()).toBe(true);
  });

  it("applies a percentage discount to the cent", () => {
    const charge = buildTuitionCharge({
      baseAmount: 1499.99,
      dueDay: 10,
      discount: { type: "PERCENTAGE", value: 15 },
      referenceDate: schoolDate(2026, 8, 1),
    });

    // 15% of 1499.99 = 225.00 (224.9985 rounded half-up)
    expect(charge.discountApplied.toFixed(2)).toBe("225.00");
    expect(charge.amount.toFixed(2)).toBe("1274.99");
  });

  it("applies a fixed discount", () => {
    const charge = buildTuitionCharge({
      baseAmount: 1500,
      dueDay: 10,
      discount: { type: "FIXED_AMOUNT", value: 200.5 },
      referenceDate: schoolDate(2026, 8, 1),
    });

    expect(charge.amount.toFixed(2)).toBe("1299.50");
  });

  it("never lets a discount produce a negative charge", () => {
    const charge = buildTuitionCharge({
      baseAmount: 100,
      dueDay: 10,
      discount: { type: "FIXED_AMOUNT", value: 500 },
      referenceDate: schoolDate(2026, 8, 1),
    });

    expect(charge.amount.toFixed(2)).toBe("0.00");
  });
});

describe("resolveFirstDueDate", () => {
  it("bills this month when the due day is still ahead", () => {
    expect(resolveFirstDueDate(10, schoolDate(2026, 8, 3)).toISOString()).toBe(
      schoolDate(2026, 8, 10).toISOString()
    );
  });

  it("bills this month when today is the due day", () => {
    expect(
      resolveFirstDueDate(10, schoolDate(2026, 8, 10, 15, 30)).toISOString()
    ).toBe(schoolDate(2026, 8, 10).toISOString());
  });

  it("rolls to next month when the due day has passed", () => {
    expect(resolveFirstDueDate(10, schoolDate(2026, 8, 11)).toISOString()).toBe(
      schoolDate(2026, 9, 10).toISOString()
    );
  });

  it("clamps a day-31 billing cycle to the end of a short month", () => {
    expect(resolveFirstDueDate(31, schoolDate(2026, 2, 1)).toISOString()).toBe(
      schoolDate(2026, 2, 28).toISOString()
    );
  });

  it("rolls over the year boundary", () => {
    expect(resolveFirstDueDate(5, schoolDate(2026, 12, 20)).toISOString()).toBe(
      schoolDate(2027, 1, 5).toISOString()
    );
  });
});
