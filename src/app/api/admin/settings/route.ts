import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

// GET - Fetch all settings
export const GET = withAuth(
  async (_request) => {
    try {
      const settings = await prisma.settings.findMany({
        orderBy: {
          label: "asc",
        },
      });

      return ok(settings);
    } catch (error: any) {
      return serverError(error, "Erro ao buscar configurações");
    }
  },
  { permission: "settings:read" }
);

// PUT - Update settings
export const PUT = withAuth(
  async (request, { user }) => {
    try {
      const { settings } = (await request.json()) as {
        settings: Record<string, unknown>;
      };

      const keys = Object.keys(settings ?? {});

      if (keys.length === 0) {
        return fail("Nenhuma configuração informada", 400);
      }

      // Snapshot for the audit trail, before anything changes.
      const previousRows = await prisma.settings.findMany({
        where: { key: { in: keys } },
        select: { key: true, value: true },
      });
      const previous = Object.fromEntries(
        previousRows.map((row) => [row.key, row.value])
      );

      // One transaction, and upsert rather than update: a key that does not exist
      // yet used to abort the request halfway through, leaving some keys saved.
      await prisma.$transaction(
        Object.entries(settings).map(([key, value]) =>
          prisma.settings.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value), label: key, type: "text" },
          })
        )
      );

      await recordAudit({
        action: "settings.update",
        entity: "Settings",
        actor: user,
        request,
        before: previous,
        after: settings,
      });

      return ok(null, { message: "Configurações atualizadas com sucesso" });
    } catch (error: any) {
      return serverError(error, "Erro ao atualizar configurações");
    }
  },
  { permission: "settings:write" }
);
