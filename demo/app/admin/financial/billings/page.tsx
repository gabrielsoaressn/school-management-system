"use client";

import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Receipt, SearchX } from "lucide-react";
import { formatCurrency, formatDate } from "@demo/lib/format";
import {
  BILLINGS,
  BILLING_STATUS_LABEL,
  type BillingStatus,
} from "@demo/lib/mock";

const STATUS_VARIANT: Record<
  BillingStatus,
  "success" | "warning" | "destructive" | "info"
> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "destructive",
  DRAFT: "info",
};

const FILTERS: { label: string; value: BillingStatus | "ALL" }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pagas", value: "PAID" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Atrasadas", value: "OVERDUE" },
  { label: "Aguardando aprovação", value: "DRAFT" },
];

/** Valor devido hoje: principal + multa + juros já apurados no mock. */
function outstanding(billing: (typeof BILLINGS)[number]) {
  return billing.amount + (billing.fine ?? 0) + (billing.interest ?? 0);
}

export default function AdminBillingsDemo() {
  const [filter, setFilter] = useState<BillingStatus | "ALL">("ALL");

  const billings =
    filter === "ALL"
      ? BILLINGS
      : BILLINGS.filter((billing) => billing.status === filter);

  const total = billings.reduce(
    (sum, billing) =>
      sum + (billing.status === "PAID" ? 0 : outstanding(billing)),
    0
  );

  return (
    <PageWrapper>
      <PageHeader
        title="Cobranças"
        subtitle={`${billings.length} cobrança(s) · ${formatCurrency(total)} em aberto`}
        icon={Receipt}
      />

      <Card padding="md">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {billings.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma cobrança neste filtro"
            description="Escolha outro status para ver as cobranças."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billings.map((billing) => (
                <TableRow key={billing.id} hover>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {billing.invoice}
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium">{billing.student}</span>
                    <span className="block text-xs text-muted-foreground">
                      {billing.guardian}
                    </span>
                  </TableCell>
                  <TableCell>{billing.description}</TableCell>
                  <TableCell>{formatDate(billing.dueDate)}</TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(outstanding(billing))}
                    </span>
                    {billing.daysLate ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatCurrency(billing.amount)} +{" "}
                        {formatCurrency(billing.fine ?? 0)} multa +{" "}
                        {formatCurrency(billing.interest ?? 0)} juros ·{" "}
                        {billing.daysLate} dia(s) de atraso
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[billing.status]}>
                      {BILLING_STATUS_LABEL[billing.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageWrapper>
  );
}
