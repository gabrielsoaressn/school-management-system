import Link from "next/link";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { findCurrentAcademicYear } from "@/lib/academic-year";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

/**
 * Teachers, with the workload each one actually carries: how many classes and
 * subjects they are assigned to in the current year. A teacher with none cannot
 * open a register, which is worth seeing at a glance.
 */
export default async function TeachersPage() {
  await requirePermission("employee:read");

  const academicYear = await findCurrentAcademicYear();

  const teachers = await prisma.teacher.findMany({
    where: { employee: { deletedAt: null } },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          phoneNumber: true,
          user: { select: { email: true, isActive: true } },
        },
      },
      subjects: { include: { subject: { select: { name: true } } } },
      // Always included so the type stays concrete; with no current year the
      // filter matches nothing, which is the honest answer.
      classAssignments: {
        where: { academicYearId: academicYear?.id ?? "__none__" },
        include: { class: { select: { name: true } } },
      },
    },
    orderBy: { employee: { firstName: "asc" } },
  });

  return (
    <>
      <PageHeader
        title="Professores"
        subtitle={`${teachers.length} professor(es)${
          academicYear ? ` · ano letivo ${academicYear.year}` : ""
        }`}
        icon={Users}
      >
        <Link href="/admin/teachers/new">
          <Button>Novo professor</Button>
        </Link>
      </PageHeader>

      <Card>
        {teachers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum professor cadastrado"
            description="Cadastre o primeiro professor para montar a grade das turmas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-semibold text-foreground">
                    Professor
                  </th>
                  <th className="p-3 font-semibold text-foreground">
                    Habilitações
                  </th>
                  <th className="p-3 font-semibold text-foreground">
                    Turmas no ano
                  </th>
                  <th className="p-3 font-semibold text-foreground">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const assignments = teacher.classAssignments;
                  const classNames = [
                    ...new Set(assignments.map((a) => a.class.name)),
                  ];

                  return (
                    <tr
                      key={teacher.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="p-3">
                        <span className="font-medium text-foreground">
                          {teacher.employee.firstName}{" "}
                          {teacher.employee.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {teacher.employee.employeeId} ·{" "}
                          {teacher.employee.user.email}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {teacher.subjects.length === 0
                          ? "—"
                          : teacher.subjects
                              .map((link) => link.subject.name)
                              .join(", ")}
                      </td>
                      <td className="p-3">
                        {classNames.length === 0 ? (
                          <Badge variant="warning" size="sm">
                            Sem turmas
                          </Badge>
                        ) : (
                          <>
                            <span className="text-foreground">
                              {classNames.length} turma(s) ·{" "}
                              {assignments.length} disciplina(s)
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {classNames.slice(0, 3).join(", ")}
                              {classNames.length > 3
                                ? ` +${classNames.length - 3}`
                                : ""}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            teacher.employee.user.isActive
                              ? "success"
                              : "default"
                          }
                          size="sm"
                        >
                          {teacher.employee.user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
