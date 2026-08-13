import Link from "next/link";
import { requirePermission } from "@/lib/auth-guards";
import { findCurrentAcademicYear } from "@/lib/academic-year";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { GraduationCap } from "lucide-react";
import StudentsList from "./StudentsList";

/** Academic view of the students: placement and guardian, not money. */
export default async function StudentsPage() {
  await requirePermission("student:read");

  const academicYear = await findCurrentAcademicYear();

  return (
    <>
      <PageHeader
        title="Alunos"
        subtitle={
          academicYear
            ? `Ano letivo ${academicYear.year}`
            : "Nenhum ano letivo definido como atual"
        }
        icon={GraduationCap}
      >
        <Link href="/admin/students/new">
          <Button>Novo aluno</Button>
        </Link>
      </PageHeader>

      <StudentsList />
    </>
  );
}
