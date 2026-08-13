import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import CurriculumEditor from "./CurriculumEditor";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Class detail: the curriculum — which subject is taught by whom — and the
 * enrolled students. Assigning a teacher here is what authorizes them to enter
 * grades and attendance for that subject.
 */
export default async function ClassDetailPage({ params }: Props) {
  await requirePermission("class:read");

  const { id } = await params;

  const schoolClass = await prisma.class.findUnique({
    where: { id },
    include: {
      academicYear: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { student: { firstName: "asc" } },
      },
    },
  });

  if (!schoolClass) {
    notFound();
  }

  return (
    <>
      <PageWrapper>
        <div className="mb-6">
          <BackButton href="/admin/classes" label="Voltar às turmas" />
        </div>

        <PageHeader
          title={schoolClass.name}
          subtitle={`Ano letivo ${schoolClass.academicYear.year} · ${
            schoolClass.enrollments.length
          } aluno(s)${
            schoolClass.roomNumber ? ` · Sala ${schoolClass.roomNumber}` : ""
          }`}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <CurriculumEditor classId={schoolClass.id} />

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Alunos matriculados
            </h2>

            {schoolClass.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {schoolClass.enrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-foreground">
                      {enrollment.student.firstName}{" "}
                      {enrollment.student.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {enrollment.student.studentId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
