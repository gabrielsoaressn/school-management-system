import { requirePermission } from "@/lib/auth-guards";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  await requirePermission("settings:write");

  // Fetch all settings
  const settings = await prisma.settings.findMany({
    orderBy: {
      label: "asc",
    },
  });

  return (
    <>
      <PageWrapper>
        <div className="mb-6 flex items-center justify-between">
          <BackButton href="/admin/dashboard" label="Voltar ao Dashboard" />
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-semibold text-foreground">
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
