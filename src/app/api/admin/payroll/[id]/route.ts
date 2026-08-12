import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single payroll record
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

    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json(
        { message: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: payroll });
  } catch (error: any) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar pagamento" },
      { status: 500 }
    );
  }
}

// PUT - Update payroll record
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
      baseSalary,
      bonus,
      deductions,
      scheduledDate,
      status,
      paidDate,
      paymentMethod,
      transactionId,
      notes,
    } = body;

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: id },
    });

    if (!existingPayroll) {
      return NextResponse.json(
        { message: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Recalculate total if any salary component changed
    let totalAmount = existingPayroll.totalAmount;
    if (baseSalary !== undefined || bonus !== undefined || deductions !== undefined) {
      const base = baseSalary !== undefined ? parseFloat(baseSalary) : existingPayroll.baseSalary;
      const bonusAmt = bonus !== undefined ? parseFloat(bonus) : existingPayroll.bonus;
      const deductAmt = deductions !== undefined ? parseFloat(deductions) : existingPayroll.deductions;
      totalAmount = base + bonusAmt - deductAmt;
    }

    // Update payroll
    const updatedPayroll = await prisma.payroll.update({
      where: { id: id },
      data: {
        baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
        bonus: bonus !== undefined ? parseFloat(bonus) : undefined,
        deductions: deductions !== undefined ? parseFloat(deductions) : undefined,
        totalAmount,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        status,
        paidDate: paidDate ? new Date(paidDate) : undefined,
        paymentMethod,
        transactionId,
        notes,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Pagamento atualizado com sucesso",
      data: updatedPayroll,
    });
  } catch (error: any) {
    console.error("Error updating payroll:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar pagamento" },
      { status: 500 }
    );
  }
}

// DELETE - Delete payroll record
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

    // Check if payroll exists
    const payroll = await prisma.payroll.findUnique({
      where: { id: id },
    });

    if (!payroll) {
      return NextResponse.json(
        { message: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Don't allow deletion of completed payments
    if (payroll.status === "COMPLETED") {
      return NextResponse.json(
        {
          message:
            "Não é possível excluir um pagamento que já foi efetuado. Considere cancelá-lo.",
        },
        { status: 400 }
      );
    }

    // Delete payroll
    await prisma.payroll.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: "Pagamento excluído com sucesso",
    });
  } catch (error: any) {
    console.error("Error deleting payroll:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir pagamento" },
      { status: 500 }
    );
  }
}
