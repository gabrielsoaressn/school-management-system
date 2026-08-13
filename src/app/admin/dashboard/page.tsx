import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FloatingAddButton from "@/components/FloatingAddButton";
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/Card";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { currentSchoolMonth, endOfMonth, startOfMonth } from "@/lib/datetime";

export default async function AdminDashboard() {
  const user = await requirePermission("admin:panel");

  const thisMonth = currentSchoolMonth();

  // Fetch dashboard data
  const [studentsCount, teachersCount, classesCount, monthlyRevenue, pendingEnrollments] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.teacher.count(),
    prisma.class.count({ where: { academicYear: { isCurrent: true } } }),
    // Revenue is what was actually received this month, from the receipts —
    // not from a status field, and no longer from the legacy Tuition model.
    prisma.payment.aggregate({
      where: {
        paidAt: {
          gte: startOfMonth(thisMonth.year, thisMonth.month),
          lte: endOfMonth(thisMonth.year, thisMonth.month),
        },
      },
      _sum: { amount: true },
    }),
    prisma.enrollmentRequest.count({ where: { status: "PENDING" } }),
  ]);

  const revenue = monthlyRevenue._sum.amount || 0;

  return (
    <>
      <PageWrapper>
        <Card>
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user.email}!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Students Card */}
            <Card padding="md" className="bg-primary text-primary-foreground border-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Alunos</p>
                  <p className="text-3xl font-bold">{studentsCount}</p>
                  <p className="text-xs opacity-75 mt-1">Total de Alunos</p>
                </div>
                <Users className="h-8 w-8 opacity-75" />
              </div>
            </Card>

            {/* Teachers Card */}
            <Card padding="md" className="bg-accent text-accent-foreground border-accent">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Professores</p>
                  <p className="text-3xl font-bold">{teachersCount}</p>
                  <p className="text-xs opacity-75 mt-1">Total de Professores</p>
                </div>
                <GraduationCap className="h-8 w-8 opacity-75" />
              </div>
            </Card>

            {/* Classes Card */}
            <Card padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Turmas</p>
                  <p className="text-3xl font-bold text-foreground">{classesCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Turmas Ativas</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>

            {/* Revenue Card */}
            <Card padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Receita</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Este Mês</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </Card>
          </div>

          {/* Modules Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Módulos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/financial"
                className="group"
              >
                <Card padding="lg" hover className="h-full transition-all group-hover:border-primary">
                  <div className="text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Gestão Financeira
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cobranças, Pagamentos e Relatórios
                    </p>
                  </div>
                </Card>
              </Link>

              <Link
                href="/admin/enrollment-requests"
                className="group relative"
              >
                <Card padding="lg" hover className="h-full transition-all group-hover:border-primary">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Matrículas Online
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Gerenciar Solicitações de Matrícula
                    </p>
                    {pendingEnrollments > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {pendingEnrollments}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>

              <Link
                href="/admin/settings"
                className="group"
              >
                <Card padding="lg" hover className="h-full transition-all group-hover:border-primary">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⚙️</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Configurações
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sistema e Valores Padrão
                    </p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Atividades Recentes</h2>
            <Card padding="md" className="bg-muted/30">
              <p className="text-muted-foreground text-center py-8">
                Nenhuma atividade recente para exibir
              </p>
            </Card>
          </div>
        </Card>
      </PageWrapper>
      <FloatingAddButton />
    </>
  );
}
