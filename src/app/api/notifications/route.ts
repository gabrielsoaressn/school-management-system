import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import { ok, serverError, validationFailed } from "@/lib/api-response";

/** GET — the caller's own notifications. Never anyone else's. */
export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);

    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return ok({ notifications, unread });
  } catch (error) {
    return serverError(error, "Erro ao buscar notificações");
  }
});

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

/**
 * PATCH — marks notifications read.
 *
 * Scoped to the caller by the where clause, so passing someone else's id is a
 * no-op rather than a way to read their inbox state.
 */
export const PATCH = withAuth(async (request, { user }) => {
  try {
    const { ids, all } = patchSchema.parse(await request.json());

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        ...(all ? {} : { id: { in: ids ?? [] } }),
      },
      data: { isRead: true },
    });

    return ok({ updated: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, "Erro ao marcar notificações");
  }
});
