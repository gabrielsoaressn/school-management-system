import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { redactEmployeeFinancials } from "@/lib/redact";

// GET - Get single employee
export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        teacher: true,
        payrolls: {
          orderBy: {
            scheduledDate: "desc",
          },
          take: 12, // Last 12 payments
        },
      },
    });

    if (!employee) {
      return fail("Funcionário não encontrado", 404);
    }

    return ok(redactEmployeeFinancials(employee, user));
  } catch (error: any) {
    return serverError(error, "Erro ao buscar funcionário");
  }
}, { permission: "employee:read" });

// PUT - Update employee
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      position,
      department,
      salary,
      cpf,
      pixKey,
      bankName,
      bankAgency,
      bankAccount,
      isActive,
    } = body;

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: id },
      include: { user: true },
    });

    if (!existingEmployee) {
      return fail("Funcionário não encontrado", 404);
    }

    // Check if CPF is being changed and if it's already in use
    if (cpf && cpf !== existingEmployee.cpf) {
      const existingCpf = await prisma.employee.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return fail("CPF já está cadastrado", 400);
      }
    }

    // Update employee and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update employee
      const updatedEmployee = await tx.employee.update({
        where: { id: id },
        data: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          phoneNumber,
          address,
          position,
          department,
          salary: salary ? parseFloat(salary) : undefined,
          cpf,
          pixKey,
          bankName,
          bankAgency,
          bankAccount,
        },
      });

      // Update user status if provided
      if (typeof isActive !== "undefined") {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: { isActive },
        });
      }

      return updatedEmployee;
    });

    return ok(result, { message: "Funcionário atualizado com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao atualizar funcionário");
  }
}, { permission: "employee:write" });

// DELETE - Delete employee
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: id },
      include: {
        user: true,
        payrolls: true,
      },
    });

    if (!employee) {
      return fail("Funcionário não encontrado", 404);
    }

    // Check if employee has payroll records
    const hasPayrolls = employee.payrolls.length > 0;

    if (hasPayrolls) {
      return fail("Não é possível excluir um funcionário com registros de pagamento. Considere desativá-lo.", 400);
    }

    // Delete employee (user will be deleted by cascade)
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    return ok(null, { message: "Funcionário excluído com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir funcionário");
  }
}, { permission: "employee:delete" });
