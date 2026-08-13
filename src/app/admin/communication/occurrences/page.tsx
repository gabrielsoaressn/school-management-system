import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { findCurrentAcademicYear } from "@/lib/academic-year";
import PageHeader from "@/components/layout/PageHeader";
import { MessageSquareWarning } from "lucide-react";
import OccurrencesBoard from "./OccurrencesBoard";

/**
 * Pedagogical occurrences: behaviour, health, praise, attendance.
 *
 * The model, the API and the seed data existed from the start with no screen, so
 * an occurrence could be recorded by an integration and never read by anyone.
 */
export default async function OccurrencesPage() {
  const user = await requirePermission("occurrence:read");

  const academicYear = await findCurrentAcademicYear();

  // Students of the current year, for the "new occurrence" form.
  const students = academicYear
    ? await prisma.student.findMany({
        where: {
          enrollments: {
            some: { academicYearId: academicYear.id, status: "ACTIVE" },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          enrollments: {
            where: { academicYearId: academicYear.id },
            select: { gradeLevel: true, section: true },
            take: 1,
          },
        },
        orderBy: { firstName: "asc" },
      })
    : [];

  return (
    <>
      <PageHeader
        title="Ocorrências"
        subtitle="Registro pedagógico de comportamento, saúde, frequência e elogios"
        icon={MessageSquareWarning}
      />

      <OccurrencesBoard
        canWrite={can(user, "occurrence:write")}
        students={students.map((student) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          placement: student.enrollments[0]
            ? `${student.enrollments[0].gradeLevel} ${student.enrollments[0].section}`
            : "—",
        }))}
      />
    </>
  );
}
