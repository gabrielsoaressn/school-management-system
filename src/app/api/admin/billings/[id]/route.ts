import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - Get single billing
export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

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
      return fail("Cobrança não encontrada", 404);
    }

    return ok(billing);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar cobrança");
  }
}, { permission: "billing:read" });

// PUT - Update billing
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

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
      return fail("Cobrança não encontrada", 404);
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

    return ok(updatedBilling, { message: "Cobrança atualizada com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao atualizar cobrança");
  }
}, { permission: "billing:write" });

// DELETE - Delete billing
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    // Check if billing exists
    const billing = await prisma.billing.findUnique({
      where: { id: id },
    });

    if (!billing) {
      return fail("Cobrança não encontrada", 404);
    }

    // Don't allow deletion of paid billings
    if (billing.status === "PAID") {
      return fail("Não é possível excluir uma cobrança que já foi paga. Considere cancelá-la.", 400);
    }

    // Delete billing
    await prisma.billing.delete({
      where: { id: id },
    });

    return ok(null, { message: "Cobrança excluída com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir cobrança");
  }
}, { permission: "billing:write" });
