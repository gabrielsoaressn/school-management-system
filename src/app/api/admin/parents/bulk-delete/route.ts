import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
        return NextResponse.json(
          { message: "Nenhum ID fornecido" },
          { status: 400 }
        );
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

    return NextResponse.json({
      message: `${deletedCount} responsável(is) excluído(s) com sucesso`,
    });
  } catch (error: any) {
    console.error("Error bulk deleting parents:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir responsáveis" },
      { status: 500 }
    );
  }
}
