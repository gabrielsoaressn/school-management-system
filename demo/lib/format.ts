/**
 * Formatação para a demo.
 *
 * O app usa src/lib/money.ts e src/lib/datetime.ts, que importam
 * `@prisma/client` e não podem entrar num bundle de browser. Aqui só
 * precisamos exibir números e datas já prontos do mock.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Recebe "2026-08-10" e devolve "10/08/2026" — sem passar por Date, que
 *  deslocaria o dia conforme o fuso do visitante. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
