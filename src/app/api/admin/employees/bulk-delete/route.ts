import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// POST - Bulk delete employees
export const POST = withAuth(async (request, { user }) => {
  try {

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
        return fail("IDs de funcionários são obrigatórios", 400);
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
      return fail("Nenhum funcionário encontrado", 404);
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

    return ok(null, { message: `${employees.length} funcionário(s) excluído(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir funcionários");
  }
}, { permission: "employee:delete" });
