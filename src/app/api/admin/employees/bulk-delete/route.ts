import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Bulk delete employees
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, deleteAll, search, type } = body;

    let employeeWhere: any = {};

    if (deleteAll) {
      // Build search filter for deleteAll
      if (search) {
        employeeWhere.OR = [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { cpf: { contains: search, mode: "insensitive" as const } },
          { employeeId: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (type && type !== "ALL") {
        employeeWhere.employeeType = type;
      }
    } else {
      // Use specific IDs
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { message: "IDs de funcionários são obrigatórios" },
          { status: 400 }
        );
      }

      employeeWhere.id = {
        in: ids,
      };
    }

    // Get employees to find their user IDs
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { message: "Nenhum funcionário encontrado" },
        { status: 404 }
      );
    }

    const employeeIds = employees.map((e) => e.id);
    const userIds = employees.map((e) => e.userId);

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete teacher profiles first (if any)
      await tx.teacher.deleteMany({
        where: {
          employeeId: {
            in: employeeIds,
          },
        },
      });

      // Delete employees
      await tx.employee.deleteMany({
        where: {
          id: {
            in: employeeIds,
          },
        },
      });

      // Delete users
      await tx.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: `${employees.length} funcionário(s) excluído(s) com sucesso`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk deleting employees:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir funcionários" },
      { status: 500 }
    );
  }
}
