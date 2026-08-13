import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";

// GET - Get single employee
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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

    return ok(employee);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar funcionário");
  }
}

// PUT - Update employee
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}

// DELETE - Delete employee
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}
