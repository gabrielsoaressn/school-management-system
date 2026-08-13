import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Users, Receipt, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@demo/lib/format";
import {
  BILLING_STATUS_LABEL,
  DEMO_USERS,
  PARENT_BILLINGS,
  PARENT_CHILDREN,
  PARENT_SUMMARY,
  SCHOOL,
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

export default function ParentDashboardDemo() {
  return (
    <PageWrapper>
      <PageHeader
        title="Portal do Responsável"
        subtitle={`Bem-vinda, ${DEMO_USERS.PARENT.name} · ${SCHOOL.referenceMonthLabel}`}
        icon={Users}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          padding="md"
          className="border-primary bg-primary text-primary-foreground"
        >
          <p className="mb-1 text-sm font-medium opacity-90">Meus filhos</p>
          <p className="text-3xl font-bold">{PARENT_SUMMARY.children}</p>
          <p className="mt-1 text-xs opacity-75">Matriculados</p>
        </Card>

        <Card padding="md" className="border-warning/20 bg-warning/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Cobranças em aberto
              </p>
              <p className="text-3xl font-bold text-warning">
                {PARENT_SUMMARY.openBillings}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aguardando pagamento
              </p>
            </div>
            <Receipt className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card padding="md" className="border-destructive/20 bg-destructive/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Total a pagar
              </p>
              <p className="text-3xl font-bold text-destructive">
                {formatCurrency(PARENT_SUMMARY.totalDue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Multa e juros incluídos
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Meus filhos
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PARENT_CHILDREN.map((child) => (
            <Card key={child.id} padding="lg" hover>
              <h3 className="text-lg font-semibold text-foreground">
                {child.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {child.className} · regente {child.homeroomTeacher}
              </p>
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Média</p>
                  <p className="text-xl font-bold text-foreground">
                    {child.average.toFixed(1).replace(".", ",")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequência</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatPercent(child.attendance)}
                  </p>
                </div>
              </div>
              <Link
                href={child.reportHref}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Ver boletim →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Cobranças recentes
        </h2>
        <Card padding="md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PARENT_BILLINGS.map((billing) => (
                <TableRow key={billing.id} hover>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {billing.invoice}
                  </TableCell>
                  <TableCell>{billing.student}</TableCell>
                  <TableCell>{formatDate(billing.dueDate)}</TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(
                        billing.amount +
                          (billing.fine ?? 0) +
                          (billing.interest ?? 0)
                      )}
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
        </Card>
      </section>
    </PageWrapper>
  );
}
