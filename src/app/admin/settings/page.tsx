import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch all settings
  const settings = await prisma.settings.findMany({
    orderBy: {
      label: 'asc',
    },
  });

  return (
    <>
      <PageHeader />

      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <BackButton href="/admin/dashboard" label="Voltar ao Dashboard" />
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Configurações do Sistema
            </h1>
            <p className="text-muted-foreground">
              Gerencie os valores padrão e configurações globais
            </p>
          </div>

          <SettingsForm settings={settings} />
        </Card>
      </PageWrapper>
    </>
  );
}
