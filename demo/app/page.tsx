import Link from "next/link";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/logo";
import Badge from "@/components/ui/Badge";
import {
  ShieldCheck,
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Github,
} from "lucide-react";
import { DemoNotice } from "@demo/components/DemoShell";
import { SCHOOL } from "@demo/lib/mock";

const PORTALS = [
  {
    role: "Administração",
    href: "/admin/dashboard",
    icon: ShieldCheck,
    user: "Helena Prado",
    description:
      "Painel, alunos, turmas, matrículas online e o módulo financeiro — cobranças, régua e folha.",
    highlights: ["Painel", "Alunos", "Turmas", "Financeiro", "Matrículas"],
  },
  {
    role: "Professor",
    href: "/teacher/dashboard",
    icon: BookOpen,
    user: "Marcos Vieira",
    description:
      "Só as turmas em que leciona: diário de notas com média calculada e chamada por aula.",
    highlights: ["Minhas turmas", "Diário de notas", "Chamada"],
  },
  {
    role: "Responsável",
    href: "/parent/dashboard",
    icon: Users,
    user: "Cláudia Ramos",
    description:
      "Os filhos, o boletim de cada um e as cobranças em aberto com multa e juros já calculados.",
    highlights: ["Meus filhos", "Cobranças", "Boletim"],
  },
  {
    role: "Aluno",
    href: "/student/dashboard",
    icon: GraduationCap,
    user: "Beatriz Ramos",
    description:
      "Notas por avaliação, frequência lançada pelo professor e o boletim do ano corrente.",
    highlights: ["Minhas notas", "Frequência", "Boletim"],
  },
];

const STACK = [
  "Next.js 15 (App Router)",
  "TypeScript strict",
  "PostgreSQL + Prisma",
  "NextAuth",
  "Tailwind CSS",
  "Vitest + Playwright",
];

export default function DemoHome() {
  return (
    <div className="min-h-screen bg-background">
      <DemoNotice />

      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <Logo size="md" showText href="/" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-10">
          <Badge variant="info" className="mb-4">
            Ano letivo {SCHOOL.academicYear} · dados fictícios
          </Badge>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-foreground">
            Sistema de Gestão Escolar
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Gestão para uma escola de ensino fundamental brasileira (1º ao 9º
            ano): quatro portais com permissões distintas, financeiro com multa
            e juros por atraso, diário de classe e matrícula online.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Esta demo é um build estático das telas, com uma escola inventada no
            lugar do banco. Não há login, nada é gravado e nenhum dado aqui
            pertence a pessoa real. O sistema em si roda com PostgreSQL e
            autenticação por sessão.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Entrar como administração
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://github.com/gabrielsoaressn/school-management-system"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Código no GitHub
            </a>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Escolha um perfil
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.role} href={portal.href} className="group">
                  <Card
                    padding="lg"
                    hover
                    className="h-full transition-all group-hover:border-primary"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {portal.role}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {portal.user}
                        </p>
                      </div>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {portal.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {portal.highlights.map((highlight) => (
                        <Badge key={highlight} variant="outline" size="sm">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Como é construído
          </h2>
          <Card padding="lg">
            <div className="flex flex-wrap gap-2">
              {STACK.map((item) => (
                <Badge key={item} variant="default">
                  {item}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              As telas da demo reaproveitam os componentes de UI e os tokens de
              design do app, então o que aparece aqui é o mesmo visual do
              sistema rodando contra o banco.
            </p>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        D&apos;Ávilla — demonstração com dados fictícios.
      </footer>
    </div>
  );
}
