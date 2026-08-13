import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

export const DELETE = withAuth(async (request, { user }) => {
  try {

    const { ids, deleteAll, search } = await request.json();

    let deletedCount = 0;

    if (deleteAll) {
      // Build where clause for search
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get all parent IDs matching the search
      const parentsToDelete = await prisma.parent.findMany({
        where: whereClause,
        select: { id: true, userId: true },
      });

      // Delete in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete parents
        await tx.parent.deleteMany({
          where: { id: { in: parentsToDelete.map(p => p.id) } },
        });

        // Delete users
        await tx.user.deleteMany({
          where: { id: { in: parentsToDelete.map(p => p.userId) } },
        });

        return parentsToDelete.length;
      });

      deletedCount = result;
    } else {
      // Delete specific IDs
      if (!ids || ids.length === 0) {
        return fail("Nenhum ID fornecido", 400);
      }

      // Get user IDs
      const parents = await prisma.parent.findMany({
        where: { id: { in: ids } },
        select: { userId: true },
      });

      // Delete in transaction
      await prisma.$transaction(async (tx) => {
        await tx.parent.deleteMany({
          where: { id: { in: ids } },
        });

        await tx.user.deleteMany({
          where: { id: { in: parents.map(p => p.userId) } },
        });
      });

      deletedCount = ids.length;
    }

    return ok(null, { message: `${deletedCount} responsável(is) excluído(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir responsáveis");
  }
}, { permission: "parent:delete" });
