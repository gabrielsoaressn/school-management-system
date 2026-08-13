import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@demo/lib/format";
import { FINANCIAL_SUMMARY, SCHOOL } from "@demo/lib/mock";

export default function AdminFinancialDemo() {
  const { receivable, paid, pending, overdue, draftBillings, payroll } =
    FINANCIAL_SUMMARY;

  return (
    <PageWrapper>
      <Card>
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-foreground">
            Gestão Financeira
          </h1>
          <p className="text-muted-foreground">
            Resumo de {SCHOOL.referenceMonthLabel}
          </p>
        </div>

        <Card padding="md" className="mb-6 border-warning/30 bg-warning/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-semibold text-foreground">
                  {draftBillings.count} cobrança(s) aguardando aprovação
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(draftBillings.total)}
                </p>
              </div>
            </div>
            <Link href="/admin/financial/billings">
              <Button variant="primary">Revisar Cobranças</Button>
            </Link>
          </div>
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card padding="md" className="border-info/20 bg-info/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Total a Receber
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(receivable.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {receivable.count} cobranças
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-info" />
            </div>
          </Card>

          <Card padding="md" className="border-success/20 bg-success/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Recebido
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(paid.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paid.count} pagamentos
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </Card>

          <Card padding="md" className="border-warning/20 bg-warning/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Pendente
                </p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(pending.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pending.count} cobranças
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </Card>

          <Card padding="md" className="border-destructive/20 bg-destructive/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Atrasado
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(overdue.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overdue.count} cobranças
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Folha de Pagamento
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card padding="md">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Total bruto
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(payroll.gross)}
              </p>
            </Card>
            <Card padding="md">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Total líquido
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(payroll.net)}
              </p>
            </Card>
            <Card padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Funcionários
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {payroll.employees}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Inadimplência
          </h2>
          <Card padding="md" className="bg-muted/30">
            <p className="text-sm text-muted-foreground">
              O sistema calcula multa de 2% e juros de 1% ao mês sobre o valor
              em aberto, por dia de atraso, e a régua de cobrança dispara os
              avisos ao responsável. Na demo, os valores já vêm calculados na
              lista de cobranças.
            </p>
            <Link
              href="/admin/financial/billings"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Ver cobranças →
            </Link>
          </Card>
        </div>
      </Card>
    </PageWrapper>
  );
}
