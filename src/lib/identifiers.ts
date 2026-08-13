import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentSchoolMonth } from "@/lib/datetime";

/**
 * Human-readable identifiers, allocated from Postgres sequences.
 *
 * They used to be derived from `count() + 1`, which collides in two ways: a
 * deleted row makes the next id reuse an existing number, and two concurrent
 * requests read the same count and produce the same id. Sequences are atomic
 * and never reused, even inside a transaction that later rolls back — a gap in
 * the numbering is fine, a duplicate invoice number is not.
 */

/** Anything that can run raw SQL: the client or a transaction client. */
type SqlRunner = Pick<typeof prisma, "$queryRaw">;

const SEQUENCES = {
  invoice: "invoice_number_seq",
  student: "student_id_seq",
  employee: "employee_id_seq",
  enrollmentRequest: "enrollment_request_number_seq",
} as const;

async function nextval(
  client: SqlRunner,
  sequence: (typeof SEQUENCES)[keyof typeof SEQUENCES]
): Promise<number> {
  const rows = await client.$queryRaw<{ value: bigint }[]>(
    Prisma.sql`SELECT nextval(${sequence}::regclass) AS value`
  );

  return Number(rows[0].value);
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

/** `INV-2026-000123` — one format for every charge, whatever created it. */
export async function nextInvoiceNumber(
  client: SqlRunner = prisma
): Promise<string> {
  const { year } = currentSchoolMonth();
  const value = await nextval(client, SEQUENCES.invoice);
  return `INV-${year}-${pad(value, 6)}`;
}

/** `EST00042` */
export async function nextStudentId(client: SqlRunner = prisma): Promise<string> {
  const value = await nextval(client, SEQUENCES.student);
  return `EST${pad(value, 5)}`;
}

/** `EMP00042` */
export async function nextEmployeeId(client: SqlRunner = prisma): Promise<string> {
  const value = await nextval(client, SEQUENCES.employee);
  return `EMP${pad(value, 5)}`;
}

/** `MAT-2026-0042` */
export async function nextEnrollmentRequestNumber(
  client: SqlRunner = prisma
): Promise<string> {
  const { year } = currentSchoolMonth();
  const value = await nextval(client, SEQUENCES.enrollmentRequest);
  return `MAT-${year}-${pad(value, 4)}`;
}
