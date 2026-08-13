import { describe, expect, it } from "vitest";
import { resolveBillingStatus } from "./payments";
import { schoolDate } from "./datetime";

const due = schoolDate(2026, 8, 10);
const beforeDue = schoolDate(2026, 8, 5);
const afterDue = schoolDate(2026, 8, 20);

describe("resolveBillingStatus", () => {
  it("is PENDING with no payments before the due date", () => {
    expect(
      resolveBillingStatus(
        { amount: 1500, dueDate: due, currentStatus: "PENDING" },
        0,
        beforeDue
      )
    ).toBe("PENDING");
  });

  it("is OVERDUE with no payments after the due date", () => {
    expect(
      resolveBillingStatus(
        { amount: 1500, dueDate: due, currentStatus: "PENDING" },
        0,
        afterDue
      )
    ).toBe("OVERDUE");
  });

  it("is PARTIALLY_PAID when the receipts fall short", () => {
    expect(
      resolveBillingStatus(
        { amount: 1500, dueDate: due, currentStatus: "PENDING" },
        "500.00",
        beforeDue
      )
    ).toBe("PARTIALLY_PAID");
  });

  it("stays PARTIALLY_PAID past the due date, not OVERDUE", () => {
    expect(
      resolveBillingStatus(
        { amount: 1500, dueDate: due, currentStatus: "OVERDUE" },
        "500.00",
        afterDue
      )
    ).toBe("PARTIALLY_PAID");
  });

  it("is PAID on the exact amount", () => {
    expect(
      resolveBillingStatus(
        { amount: "1499.99", dueDate: due, currentStatus: "PENDING" },
        "1499.99",
        afterDue
      )
    ).toBe("PAID");
  });

  it("is PAID when the guardian overpays", () => {
    expect(
      resolveBillingStatus(
        { amount: 1500, dueDate: due, currentStatus: "PENDING" },
        1600,
        afterDue
      )
    ).toBe("PAID");
  });

  it("is short by one cent, and says so", () => {
    // The float version of this comparison is exactly where "paid" invoices
    // with a cent outstanding come from.
    expect(
      resolveBillingStatus(
        { amount: "1500.00", dueDate: due, currentStatus: "PENDING" },
        "1499.99",
        beforeDue
      )
    ).toBe("PARTIALLY_PAID");
  });

  it("never overrides a state a person chose", () => {
    for (const status of ["DRAFT", "CANCELLED", "RENEGOTIATED"] as const) {
      expect(
        resolveBillingStatus(
          { amount: 1500, dueDate: due, currentStatus: status },
          1500,
          afterDue
        )
      ).toBe(status);
    }
  });
});
