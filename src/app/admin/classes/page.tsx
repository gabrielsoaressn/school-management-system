import Link from "next/link";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { findCurrentAcademicYear } from "@/lib/academic-year";
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen, ChevronRight } from "lucide-react";

/**
 * Classes of the current academic year, with how staffed each one is. The
 * unstaffed count matters: a subject with no teacher is a subject nobody can
 * enter grades for.
 */
export default async function ClassesPage() {
  await requirePermission("class:read");

  const academicYear = await findCurrentAcademicYear();

  const classes = academicYear
    ? await prisma.class.findMany({
        where: { academicYearId: academicYear.id },
        include: {
          assignments: { select: { teacherId: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
      })
    : [];

  return (
    <>
      <PageWrapper>
        <div className="mb-6">
          <BackButton href="/admin/dashboard" label="Voltar ao Dashboard" />
        </div>

        <PageHeader
          title="Turmas"
          subtitle={
            academicYear
              ? `Ano letivo ${academicYear.year} · ${classes.length} turma(s)`
              : "Nenhum ano letivo definido como atual"
          }
          icon={BookOpen}
        >
          <Link href="/admin/classes/new">
            <Button>Nova turma</Button>
          </Link>
        </PageHeader>

        {!academicYear ? (
          <Card>
            <EmptyState
              icon={BookOpen}
              title="Nenhum ano letivo atual"
              description="Defina o ano letivo corrente para cadastrar turmas."
            />
          </Card>
        ) : classes.length === 0 ? (
          <Card>
            <EmptyState
              icon={BookOpen}
              title="Nenhuma turma cadastrada"
              description={`Crie as turmas do ano letivo ${academicYear.year}.`}
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((schoolClass) => {
              const unstaffed = schoolClass.assignments.filter(
                (assignment) => !assignment.teacherId
              ).length;

              return (
                <Link
                  key={schoolClass.id}
                  href={`/admin/classes/${schoolClass.id}`}
                >
                  <Card hover className="h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {schoolClass.name}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {schoolClass._count.enrollments} aluno(s)
                          {schoolClass.roomNumber
                            ? ` · Sala ${schoolClass.roomNumber}`
                            : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant="default" size="sm">
                        {schoolClass.assignments.length} disciplina(s)
                      </Badge>
                      {unstaffed > 0 ? (
                        <Badge variant="warning" size="sm">
                          {unstaffed} sem professor
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          Grade completa
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
