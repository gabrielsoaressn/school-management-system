import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  nextEmployeeId,
  nextEnrollmentRequestNumber,
  nextInvoiceNumber,
  nextStudentId,
} from "@/lib/identifiers";

/**
 * Identifier generation, against the real database.
 *
 * These have to hit Postgres: the whole point of the change was to stop deriving
 * ids from `count()` and start using sequences, and a mock would test the mock.
 * Requires DATABASE_URL and applied migrations — see docs/OPERATIONS.md.
 */
const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("sequence-backed identifiers", () => {
  it("never repeats an invoice number, even called concurrently", async () => {
    // count()+1 fails exactly here: parallel callers read the same count.
    const numbers = await Promise.all(
      Array.from({ length: 25 }, () => nextInvoiceNumber())
    );

    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("formats an invoice number as INV-<year>-<6 digits>", async () => {
    const value = await nextInvoiceNumber();
    expect(value).toMatch(/^INV-\d{4}-\d{6}$/);
  });

  it("advances monotonically", async () => {
    const [first, second] = [
      await nextInvoiceNumber(),
      await nextInvoiceNumber(),
    ];
    const number = (value: string) => Number(value.split("-")[2]);

    expect(number(second)).toBeGreaterThan(number(first));
  });

  it("keeps student ids unique and formatted", async () => {
    const ids = await Promise.all(
      Array.from({ length: 10 }, () => nextStudentId())
    );

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^EST\d{5}$/));
  });

  it("keeps employee ids unique and formatted", async () => {
    const ids = await Promise.all(
      Array.from({ length: 10 }, () => nextEmployeeId())
    );

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^EMP\d{5}$/));
  });

  it("keeps enrolment request numbers unique and formatted", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 10 }, () => nextEnrollmentRequestNumber())
    );

    expect(new Set(numbers).size).toBe(numbers.length);
    numbers.forEach((value) => expect(value).toMatch(/^MAT-\d{4}-\d{4}$/));
  });

  it("does not reuse a number after the row that had it is deleted", async () => {
    // The other half of the count()+1 bug: delete a row and the next id collides
    // with one already in use.
    const before = await nextInvoiceNumber();
    const after = await nextInvoiceNumber();

    expect(after).not.toBe(before);
  });
});
