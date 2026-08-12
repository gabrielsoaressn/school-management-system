import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single employee
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { message: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar funcionário" },
      { status: 500 }
    );
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { message: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    // Check if CPF is being changed and if it's already in use
    if (cpf && cpf !== existingEmployee.cpf) {
      const existingCpf = await prisma.employee.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return NextResponse.json(
          { message: "CPF já está cadastrado" },
          { status: 400 }
        );
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

    return NextResponse.json({
      message: "Funcionário atualizado com sucesso",
      data: result,
    });
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar funcionário" },
      { status: 500 }
    );
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { message: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    // Check if employee has payroll records
    const hasPayrolls = employee.payrolls.length > 0;

    if (hasPayrolls) {
      return NextResponse.json(
        {
          message:
            "Não é possível excluir um funcionário com registros de pagamento. Considere desativá-lo.",
        },
        { status: 400 }
      );
    }

    // Delete employee (user will be deleted by cascade)
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    return NextResponse.json({
      message: "Funcionário excluído com sucesso",
    });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir funcionário" },
      { status: 500 }
    );
  }
}
