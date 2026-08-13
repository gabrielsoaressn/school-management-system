import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

export const POST = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {

    const { id } = await params;

    // Check if billing exists and is in DRAFT status
    const billing = await prisma.billing.findUnique({
      where: { id },
    });

    if (!billing) {
      return fail("Cobrança não encontrada", 404);
    }

    if (billing.status !== "DRAFT") {
      return fail("Esta cobrança já foi processada", 400);
    }

    // Update status to CANCELLED
    await prisma.billing.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: billing.notes
          ? `${billing.notes} | Rejeitado pelo administrador`
          : "Rejeitado pelo administrador",
      },
    });

    await recordAudit({
      action: "billing.reject",
      entity: "Billing",
      entityId: id,
      actor: user,
      request,
      before: { status: billing.status, amount: billing.amount },
      after: { status: "CANCELLED" },
    });

    return ok(null, { message: "Cobrança rejeitada e cancelada" });
  } catch (error: any) {
    return serverError(error, "Erro ao rejeitar cobrança");
  }
}, { permission: "billing:approve" });
