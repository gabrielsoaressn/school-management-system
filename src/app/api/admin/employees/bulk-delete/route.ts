import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

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

    // Soft delete: payroll history points at these rows and must survive.
    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.employee.updateMany({
        where: { id: { in: employeeIds } },
        data: { deletedAt },
      }),
      prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false },
      }),
    ]);

    await recordAudit({
      action: "employee.delete",
      entity: "Employee",
      actor: user,
      request,
      after: {
        ids: employeeIds,
        deletedAt,
        deleteAll: !!deleteAll,
        names: employees.map((e) => `${e.firstName} ${e.lastName}`),
      },
    });

    return ok(null, { message: `${employees.length} funcionário(s) excluído(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir funcionários");
  }
}, { permission: "employee:delete" });
