import { Prisma } from "@prisma/client";

/**
 * Money handling.
 *
 * Amounts live as `Decimal(10,2)` in the database and as `Prisma.Decimal` in
 * server code — never as a float, so 0.1 + 0.2 is 0.30 and not 0.30000000000004.
 * `Prisma.Decimal` serializes to a JSON string, so anything crossing to the
 * client goes through the API envelope, which converts it to a number for
 * display. Never do arithmetic on that number: send the operation to the server.
 */

export type MoneyInput = Prisma.Decimal | number | string | null | undefined;

export const ZERO = new Prisma.Decimal(0);

export function toDecimal(value: MoneyInput): Prisma.Decimal {
  if (value === null || value === undefined || value === "") return ZERO;
  return value instanceof Prisma.Decimal
    ? value
    : new Prisma.Decimal(value as number | string);
}

/** Rounds half-up to cents, the convention for invoices in Brazil. */
export function toCents(value: MoneyInput): Prisma.Decimal {
  return toDecimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function sum(values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (total, value) => total.plus(toDecimal(value)),
    ZERO
  );
}

export function subtract(a: MoneyInput, b: MoneyInput): Prisma.Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/** Percentage of an amount, rounded to cents. `percent` is 0-100. */
export function percentOf(
  value: MoneyInput,
  percent: MoneyInput
): Prisma.Decimal {
  return toCents(toDecimal(value).times(toDecimal(percent)).dividedBy(100));
}

export function isZero(value: MoneyInput): boolean {
  return toDecimal(value).isZero();
}

export function isNegative(value: MoneyInput): boolean {
  return toDecimal(value).isNegative();
}

export function greaterThan(a: MoneyInput, b: MoneyInput): boolean {
  return toDecimal(a).greaterThan(toDecimal(b));
}

/** Only for display and for JSON payloads. Never for arithmetic. */
export function toNumber(value: MoneyInput): number {
  return toDecimal(value).toNumber();
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 1.234,56" — accepts Decimal, number or the string the API sends. */
export function formatCurrency(value: MoneyInput): string {
  return BRL.format(toNumber(value));
}

/**
 * Splits an amount into `installments` parts that add back to the original:
 * the remainder in cents goes to the first instalment, as banks do.
 */
export function splitInstallments(
  total: MoneyInput,
  installments: number
): Prisma.Decimal[] {
  if (installments < 1) {
    throw new Error("O número de parcelas deve ser pelo menos 1");
  }

  const amount = toCents(total);
  const base = toCents(
    amount.dividedBy(installments).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN)
  );
  const parts = Array.from({ length: installments }, () => base);
  const remainder = amount.minus(base.times(installments));

  parts[0] = parts[0].plus(remainder);
  return parts;
}
