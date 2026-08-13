import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/api-response";

// GET - Fetch all settings
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

    const settings = await prisma.settings.findMany({
      orderBy: {
        label: 'asc',
      },
    });

    return ok(settings);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar configurações");
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}
