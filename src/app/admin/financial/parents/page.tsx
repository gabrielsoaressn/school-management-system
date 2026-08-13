import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ParentsTable from "./ParentsTable";
import { UserPlus } from "lucide-react";

export default async function ParentsPage() {
  await requirePermission("parent:read");

  return (
    <>
      <PageWrapper>
        <div className="mb-6 flex items-center justify-between">
          <BackButton href="/admin/financial" />
          <Link href="/admin/financial/parents/new">
            <Button variant="primary">
              <UserPlus className="h-4 w-4" />
              Novo Responsável
            </Button>
          </Link>
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-semibold text-foreground">
              Responsáveis Financeiros
            </h1>
            <p className="text-muted-foreground">
              Gerenciar responsáveis e seus dados cadastrais
            </p>
          </div>

          <ParentsTable />
        </Card>
      </PageWrapper>
    </>
  );
}
