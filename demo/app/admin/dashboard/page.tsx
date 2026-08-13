import Link from "next/link";
import Card from "@/components/ui/Card";
import PageWrapper from "@/components/layout/PageWrapper";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@demo/lib/format";
import { ADMIN_STATS, ANNOUNCEMENTS, DEMO_USERS, SCHOOL } from "@demo/lib/mock";

export default function AdminDashboardDemo() {
  return (
    <PageWrapper>
      <Card>
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Bem-vinda, {DEMO_USERS.ADMIN.name}! — {SCHOOL.referenceMonthLabel}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card
            padding="md"
            className="border-primary bg-primary text-primary-foreground"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium opacity-90">Alunos</p>
                <p className="text-3xl font-bold">{ADMIN_STATS.students}</p>
                <p className="mt-1 text-xs opacity-75">Total de Alunos</p>
              </div>
              <Users className="h-8 w-8 opacity-75" />
            </div>
          </Card>

          {/* !bg-accent, não bg-accent: o Card já traz bg-card, que o Tailwind
              emite depois de bg-accent e venceria o empate de especificidade —
              o cartão saía branco com texto branco. A mesma linha em
              src/app/admin/dashboard/page.tsx tem esse defeito. */}
          <Card
            padding="md"
            className="border-accent !bg-accent text-accent-foreground"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium opacity-90">
                  Professores
                </p>
                <p className="text-3xl font-bold">{ADMIN_STATS.teachers}</p>
                <p className="mt-1 text-xs opacity-75">Total de Professores</p>
              </div>
              <GraduationCap className="h-8 w-8 opacity-75" />
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Turmas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ADMIN_STATS.classes}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Turmas Ativas
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Receita
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(ADMIN_STATS.monthlyRevenue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Este Mês</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </Card>
        </div>

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

            <Link href="/admin/enrollment-requests" className="group relative">
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
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {ADMIN_STATS.pendingEnrollments}
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/classes" className="group">
              <Card
                padding="lg"
                hover
                className="h-full transition-all group-hover:border-primary"
              >
                <div className="text-center">
                  <div className="mb-3 text-4xl">🏫</div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    Turmas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enturmação, Grade e Professores
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Avisos Recentes
          </h2>
          <Card padding="none" className="divide-y divide-border">
            {ANNOUNCEMENTS.map((announcement) => (
              <div
                key={announcement.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {announcement.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {announcement.audience}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(announcement.publishedAt)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </Card>
    </PageWrapper>
  );
}
