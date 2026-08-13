import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmployeesTable from "./EmployeesTable";
import { UserPlus } from "lucide-react";

export default async function EmployeesPage() {
  await requirePermission("employee:read");

  return (
    <>
      <PageWrapper>
        <div className="mb-6 flex items-center justify-between">
          <BackButton href="/admin/financial" />
          <Link href="/admin/financial/employees/new">
            <Button variant="primary">
              <UserPlus className="h-4 w-4" />
              Novo Funcionário
            </Button>
          </Link>
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-semibold text-foreground">
              Funcionários
            </h1>
            <p className="text-muted-foreground">
              Gerenciar funcionários e dados bancários
            </p>
          </div>

          <EmployeesTable />
        </Card>
      </PageWrapper>
    </>
  );
}
