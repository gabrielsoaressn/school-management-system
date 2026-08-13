import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - Fetch all settings
export const GET = withAuth(async (request, { user }) => {
  try {

    const settings = await prisma.settings.findMany({
      orderBy: {
        label: 'asc',
      },
    });

    return ok(settings);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar configurações");
  }
}, { permission: "settings:read" });

// PUT - Update settings
export const PUT = withAuth(async (request, { user }) => {
  try {

    const { settings } = await request.json();

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.settings.update({
        where: { key },
        data: { value: String(value) },
      })
    );

    await Promise.all(updates);

    return ok(null, { message: "Configurações atualizadas com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao atualizar configurações");
  }
}, { permission: "settings:write" });
