import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StudentsTable from "./StudentsTable";
import { GraduationCap } from "lucide-react";

export default async function StudentsPage() {
  await requirePermission("student:read");

  return (
    <>
      <PageWrapper>
        <div className="mb-6 flex items-center justify-between">
          <BackButton href="/admin/financial" />
          <Link href="/admin/students/new">
            <Button variant="primary">
              <GraduationCap className="h-4 w-4" />
              Novo Aluno
            </Button>
          </Link>
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-semibold text-foreground">
              Alunos
            </h1>
            <p className="text-muted-foreground">
              Gerenciar alunos e matrículas
            </p>
          </div>

          <StudentsTable />
        </Card>
      </PageWrapper>
    </>
  );
}
