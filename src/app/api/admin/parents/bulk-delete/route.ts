import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

/**
 * Soft delete: the guardian record and its login are deactivated, never
 * removed. Billing history, guardianship links and the audit trail all point at
 * these rows, and financial records must survive an accidental "select all".
 */
export const DELETE = withAuth(async (request, { user }) => {
  try {
    const { ids, deleteAll, search } = await request.json();

    let targets: { id: string; userId: string }[];

    if (deleteAll) {
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ];
      }

      targets = await prisma.parent.findMany({
        where: whereClause,
        select: { id: true, userId: true },
      });
    } else {
      if (!ids || ids.length === 0) {
        return fail("Nenhum ID fornecido", 400);
      }

      targets = await prisma.parent.findMany({
        where: { id: { in: ids } },
        select: { id: true, userId: true },
      });
    }

    if (targets.length === 0) {
      return fail("Nenhum responsável encontrado para excluir", 404);
    }

    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.parent.updateMany({
        where: { id: { in: targets.map((p) => p.id) } },
        data: { deletedAt },
      }),
      // The login goes inactive so the guardian can no longer sign in.
      prisma.user.updateMany({
        where: { id: { in: targets.map((p) => p.userId) } },
        data: { isActive: false },
      }),
    ]);

    await recordAudit({
      action: "parent.delete",
      entity: "Parent",
      actor: user,
      request,
      after: { ids: targets.map((p) => p.id), deletedAt, deleteAll: !!deleteAll },
    });

    return ok(null, {
      message: `${targets.length} responsável(is) excluído(s) com sucesso`,
    });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir responsáveis");
  }
}, { permission: "parent:delete" });
