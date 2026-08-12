import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single billing
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

    const billing = await prisma.billing.findUnique({
      where: { id: id },
      include: {
        parent: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            students: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
      },
    });

    if (!billing) {
      return NextResponse.json(
        { message: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: billing });
  } catch (error: any) {
    console.error("Error fetching billing:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar cobrança" },
      { status: 500 }
    );
  }
}

// PUT - Update billing
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
      type,
      description,
      amount,
      dueDate,
      status,
      paidDate,
      paymentMethod,
      transactionId,
      isRecurring,
      recurrence,
      notes,
    } = body;

    // Check if billing exists
    const existingBilling = await prisma.billing.findUnique({
      where: { id: id },
    });

    if (!existingBilling) {
      return NextResponse.json(
        { message: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    // Calculate next billing date if recurring settings changed
    let nextBillingDate = existingBilling.nextBillingDate;
    if (isRecurring && recurrence !== "NONE" && dueDate) {
      const dueDateObj = new Date(dueDate);
      switch (recurrence) {
        case "MONTHLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case "ANNUALLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }
    } else if (!isRecurring) {
      nextBillingDate = null;
    }

    // Update billing
    const updatedBilling = await prisma.billing.update({
      where: { id: id },
      data: {
        type,
        description,
        amount: amount ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        paidDate: paidDate ? new Date(paidDate) : undefined,
        paymentMethod,
        transactionId,
        isRecurring,
        recurrence,
        nextBillingDate,
        notes,
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Cobrança atualizada com sucesso",
      data: updatedBilling,
    });
  } catch (error: any) {
    console.error("Error updating billing:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar cobrança" },
      { status: 500 }
    );
  }
}

// DELETE - Delete billing
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

    // Check if billing exists
    const billing = await prisma.billing.findUnique({
      where: { id: id },
    });

    if (!billing) {
      return NextResponse.json(
        { message: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    // Don't allow deletion of paid billings
    if (billing.status === "PAID") {
      return NextResponse.json(
        {
          message:
            "Não é possível excluir uma cobrança que já foi paga. Considere cancelá-la.",
        },
        { status: 400 }
      );
    }

    // Delete billing
    await prisma.billing.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: "Cobrança excluída com sucesso",
    });
  } catch (error: any) {
    console.error("Error deleting billing:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir cobrança" },
      { status: 500 }
    );
  }
}
