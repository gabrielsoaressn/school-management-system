import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { toCents, toDecimal } from "@/lib/money";

// GET - Get single payroll record
export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    try {
      const { id } = await params;

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
        return fail("Pagamento não encontrado", 404);
      }

      return ok(payroll);
    } catch (error: any) {
      return serverError(error, "Erro ao buscar pagamento");
    }
  },
  { permission: "payroll:read" }
);

// PUT - Update payroll record
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;

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
        return fail("Pagamento não encontrado", 404);
      }

      // Recalculate total if any salary component changed
      let totalAmount = existingPayroll.totalAmount;
      if (
        baseSalary !== undefined ||
        bonus !== undefined ||
        deductions !== undefined
      ) {
        const base = toDecimal(baseSalary ?? existingPayroll.baseSalary);
        const bonusAmt = toDecimal(bonus ?? existingPayroll.bonus);
        const deductAmt = toDecimal(deductions ?? existingPayroll.deductions);
        totalAmount = toCents(base.plus(bonusAmt).minus(deductAmt));
      }

      // Update payroll
      const updatedPayroll = await prisma.payroll.update({
        where: { id: id },
        data: {
          baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
          bonus: bonus !== undefined ? parseFloat(bonus) : undefined,
          deductions:
            deductions !== undefined ? parseFloat(deductions) : undefined,
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

      await recordAudit({
        action: "payroll.update",
        entity: "Payroll",
        entityId: id,
        actor: user,
        request,
        before: existingPayroll,
        after: updatedPayroll,
      });

      return ok(updatedPayroll, {
        message: "Pagamento atualizado com sucesso",
      });
    } catch (error: any) {
      return serverError(error, "Erro ao atualizar pagamento");
    }
  },
  { permission: "payroll:write" }
);

// DELETE - Delete payroll record
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    try {
      const { id } = await params;

      // Check if payroll exists
      const payroll = await prisma.payroll.findUnique({
        where: { id: id },
      });

      if (!payroll) {
        return fail("Pagamento não encontrado", 404);
      }

      // Don't allow deletion of completed payments
      if (payroll.status === "COMPLETED") {
        return fail(
          "Não é possível excluir um pagamento que já foi efetuado. Considere cancelá-lo.",
          400
        );
      }

      // Delete payroll
      await prisma.payroll.delete({
        where: { id: id },
      });

      return ok(null, { message: "Pagamento excluído com sucesso" });
    } catch (error: any) {
      return serverError(error, "Erro ao excluir pagamento");
    }
  },
  { permission: "payroll:write" }
);
