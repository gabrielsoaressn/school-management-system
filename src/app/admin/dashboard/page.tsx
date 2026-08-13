import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FloatingAddButton from "@/components/FloatingAddButton";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/Card";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { currentSchoolMonth, endOfMonth, startOfMonth } from "@/lib/datetime";

export default async function AdminDashboard() {
  const user = await requirePermission("admin:panel");

  const thisMonth = currentSchoolMonth();

  // Fetch dashboard data
  const [
    studentsCount,
    teachersCount,
    classesCount,
    monthlyRevenue,
    pendingEnrollments,
  ] = await Promise.all([
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
            <h1 className="mb-2 text-3xl font-semibold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">Bem-vindo, {user.email}!</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Students Card */}
            <Card
              padding="md"
              className="border-primary bg-primary text-primary-foreground"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium opacity-90">Alunos</p>
                  <p className="text-3xl font-bold">{studentsCount}</p>
                  <p className="mt-1 text-xs opacity-75">Total de Alunos</p>
                </div>
                <Users className="h-8 w-8 opacity-75" />
              </div>
            </Card>

            {/* Teachers Card */}
            <Card
              padding="md"
              className="border-accent bg-accent text-accent-foreground"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium opacity-90">
                    Professores
                  </p>
                  <p className="text-3xl font-bold">{teachersCount}</p>
                  <p className="mt-1 text-xs opacity-75">
                    Total de Professores
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 opacity-75" />
              </div>
            </Card>

            {/* Classes Card */}
            <Card padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Turmas
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {classesCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Turmas Ativas
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>

            {/* Revenue Card */}
            <Card padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Receita
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(revenue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Este Mês</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </Card>
          </div>

          {/* Modules Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Módulos
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/financial" className="group">
                <Card
                  padding="lg"
                  hover
                  className="h-full transition-all group-hover:border-primary"
                >
                  <div className="text-center">
                    <div className="mb-3 text-4xl">💰</div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
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
                <Card
                  padding="lg"
                  hover
                  className="h-full transition-all group-hover:border-primary"
                >
                  <div className="text-center">
                    <div className="mb-3 text-4xl">📝</div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
                      Matrículas Online
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Gerenciar Solicitações de Matrícula
                    </p>
                    {pendingEnrollments > 0 && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {pendingEnrollments}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>

              <Link href="/admin/settings" className="group">
                <Card
                  padding="lg"
                  hover
                  className="h-full transition-all group-hover:border-primary"
                >
                  <div className="text-center">
                    <div className="mb-3 text-4xl">⚙️</div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
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
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Atividades Recentes
            </h2>
            <Card padding="md" className="bg-muted/30">
              <p className="py-8 text-center text-muted-foreground">
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
