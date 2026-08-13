import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import { DEMO_USERS, TEACHER_CLASSES } from "@demo/lib/mock";

export default function TeacherDashboardDemo() {
  const students = TEACHER_CLASSES.reduce(
    (total, turma) => total + turma.students,
    0
  );
  const pending = TEACHER_CLASSES.reduce(
    (total, turma) => total + turma.pendingGrades,
    0
  );

  return (
    <PageWrapper>
      <PageHeader
        title="Portal do Professor"
        subtitle={`Bem-vindo, ${DEMO_USERS.TEACHER.name}`}
        icon={BookOpen}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Turmas</p>
              <p className="text-2xl font-bold text-foreground">
                {TEACHER_CLASSES.length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <p className="text-2xl font-bold text-foreground">{students}</p>
            </div>
            <Users className="h-8 w-8 text-success" />
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Notas pendentes</p>
              <p className="text-2xl font-bold text-foreground">{pending}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      <h2 className="mb-3 text-xl font-semibold text-foreground">
        Minhas turmas
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        O professor vê apenas as turmas em que leciona — a mesma regra vale nas
        rotas de API do sistema.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TEACHER_CLASSES.map((turma) => (
          <Card key={turma.id} padding="lg" hover>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {turma.name}
                </h3>
                <p className="text-sm text-muted-foreground">{turma.subject}</p>
              </div>
              {turma.pendingGrades > 0 ? (
                <Badge variant="warning">
                  {turma.pendingGrades} nota(s) pendente(s)
                </Badge>
              ) : (
                <Badge variant="success">Em dia</Badge>
              )}
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              {turma.students} alunos · próxima aula {turma.nextLesson}
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/teacher/grades"
                className="inline-flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Lançar notas
                </span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/teacher/attendance"
                className="inline-flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Fazer chamada
                </span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
