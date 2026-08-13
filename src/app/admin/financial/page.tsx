import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, subtract } from "@/lib/money";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Users,
  UserCheck,
  GraduationCap,
} from "lucide-react";
import { currentSchoolMonth, endOfMonth, startOfMonth } from "@/lib/datetime";

export default async function FinancialDashboard() {
  const user = await requirePermission("billing:read");

  // Reference month in the school's timezone, not the server's.
  const { year: currentYear, month: currentMonth } = currentSchoolMonth();
  const referenceMonth = currentMonth;
  const referenceYear = currentYear;

  const startDate = startOfMonth(referenceYear, referenceMonth);
  const endDate = endOfMonth(referenceYear, referenceMonth);

  // Fetch all financial data in parallel
  const [
    // Billings (Contas a Receber)
    totalBillings,
    paidBillings,
    pendingBillings,
    overdueBillings,
    draftBillings,

    // Payroll (Contas a Pagar)
    totalPayroll,
    completedPayroll,
    scheduledPayroll,

    // Counts
    totalParents,
    totalEmployees,
    totalStudents,
  ] = await Promise.all([
    // Billings aggregations
    prisma.billing.aggregate({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    prisma.billing.aggregate({
      where: {
        status: "PAID",
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    prisma.billing.aggregate({
      where: {
        status: "PENDING",
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    prisma.billing.aggregate({
      where: {
        status: "OVERDUE",
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    prisma.billing.aggregate({
      where: {
        status: "DRAFT",
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    // Payroll aggregations
    prisma.payroll.aggregate({
      where: {
        referenceMonth,
        referenceYear,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),

    prisma.payroll.aggregate({
      where: {
        status: "COMPLETED",
        referenceMonth,
        referenceYear,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),

    prisma.payroll.aggregate({
      where: {
        status: "SCHEDULED",
        referenceMonth,
        referenceYear,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),

    // Counts
    prisma.parent.count(),
    prisma.employee.count(),
    prisma.student.count(),
  ]);

  // Calculate summary
  const summary = {
    // Contas a Receber
    accountsReceivable: {
      total: totalBillings._sum.amount || 0,
      paid: paidBillings._sum.amount || 0,
      pending: pendingBillings._sum.amount || 0,
      overdue: overdueBillings._sum.amount || 0,
      totalCount: totalBillings._count || 0,
      paidCount: paidBillings._count || 0,
      pendingCount: pendingBillings._count || 0,
      overdueCount: overdueBillings._count || 0,
    },

    // Contas a Pagar
    accountsPayable: {
      total: totalPayroll._sum.totalAmount || 0,
      completed: completedPayroll._sum.totalAmount || 0,
      scheduled: scheduledPayroll._sum.totalAmount || 0,
      totalCount: totalPayroll._count || 0,
      completedCount: completedPayroll._count || 0,
      scheduledCount: scheduledPayroll._count || 0,
    },

    // Balance
    balance: {
      expected: subtract(totalBillings._sum.amount, totalPayroll._sum.totalAmount),
      actual: subtract(paidBillings._sum.amount, completedPayroll._sum.totalAmount),
    },

    // Counts
    counts: {
      parents: totalParents,
      employees: totalEmployees,
      students: totalStudents,
    },
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <>

      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <BackButton href="/admin/dashboard" label="Voltar ao Dashboard" />
        </div>

        <Card>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Gestão Financeira
            </h1>
            <p className="text-muted-foreground">
              Resumo de {monthNames[currentMonth - 1]} {currentYear}
            </p>
          </div>

          {/* Pending Approval Alert */}
          {draftBillings._count > 0 && (
            <Card padding="md" className="mb-6 bg-warning/10 border-warning/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {draftBillings._count} cobrança(s) aguardando aprovação
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency((draftBillings._sum.amount || 0))}
                    </p>
                  </div>
                </div>
                <Link href="/admin/financial/billings/pending-approval">
                  <Button variant="primary">
                    Revisar Cobranças
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total a Receber */}
            <Card padding="md" className="bg-info/5 border-info/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total a Receber</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.accountsReceivable.total)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.accountsReceivable.totalCount} cobranças
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-info" />
              </div>
            </Card>

            {/* Recebido */}
            <Card padding="md" className="bg-success/5 border-success/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Recebido</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(summary.accountsReceivable.paid)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.accountsReceivable.paidCount} pagamentos
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </Card>

            {/* Pendente */}
            <Card padding="md" className="bg-warning/5 border-warning/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pendente</p>
                  <p className="text-2xl font-bold text-warning">
                    {formatCurrency(summary.accountsReceivable.pending)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.accountsReceivable.pendingCount} cobranças
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </Card>

            {/* Atrasado */}
            <Card padding="md" className="bg-destructive/5 border-destructive/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Atrasado</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(summary.accountsReceivable.overdue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.accountsReceivable.overdueCount} cobranças
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive" />
              </div>
            </Card>
          </div>

          {/* Payroll Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Folha de Pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card padding="md" hover>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(summary.accountsPayable.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.accountsPayable.totalCount} funcionários
                </p>
              </Card>

              <Card padding="md" className="bg-success/5 border-success/20">
                <p className="text-sm font-medium text-muted-foreground mb-1">Pago</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(summary.accountsPayable.completed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.accountsPayable.completedCount} pagamentos
                </p>
              </Card>

              <Card padding="md" className="bg-warning/5 border-warning/20">
                <p className="text-sm font-medium text-muted-foreground mb-1">Programado</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(summary.accountsPayable.scheduled)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.accountsPayable.scheduledCount} pagamentos
                </p>
              </Card>
            </div>
          </div>

          {/* Balance */}
          <Card padding="lg" className="mb-8 bg-primary text-primary-foreground border-primary">
            <h3 className="text-xl font-semibold mb-6">Balanço do Mês</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm opacity-90 mb-2">Balanço Esperado</p>
                <p className="text-4xl font-bold">
                  {formatCurrency(summary.balance.expected)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Total a Receber - Folha de Pagamento
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-2">Balanço Real</p>
                <p className="text-4xl font-bold">
                  {formatCurrency(summary.balance.actual)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Recebido - Pago
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/financial/billings">
                <Button variant="outline" className="w-full" size="lg">
                  Cobranças
                </Button>
              </Link>
              <Link href="/admin/financial/billings/new">
                <Button variant="primary" className="w-full" size="lg">
                  Nova Cobrança
                </Button>
              </Link>
              <Link href="/admin/financial/payroll">
                <Button variant="outline" className="w-full" size="lg">
                  Folha de Pagamento
                </Button>
              </Link>
              <Link href="/admin/financial/payroll/new">
                <Button variant="secondary" className="w-full" size="lg">
                  Novo Pagamento
                </Button>
              </Link>
            </div>
          </div>

          {/* Management Links */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Gestão Cadastral</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/financial/parents" className="group">
                <Card padding="md" hover className="h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Responsáveis</p>
                      <p className="text-2xl font-bold text-foreground">
                        {summary.counts.parents}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/financial/employees" className="group">
                <Card padding="md" hover className="h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Funcionários</p>
                      <p className="text-2xl font-bold text-foreground">
                        {summary.counts.employees}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>

              <Link href="/admin/financial/students" className="group">
                <Card padding="md" hover className="h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Alunos</p>
                      <p className="text-2xl font-bold text-foreground">
                        {summary.counts.students}
                      </p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </Card>
      </PageWrapper>
    </>
  );
}
