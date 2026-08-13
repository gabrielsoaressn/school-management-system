import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

export const POST = withAuth(async (request, { user }) => {
  try {

    // Count draft billings
    const count = await prisma.billing.count({
      where: { status: "DRAFT" },
    });

    if (count === 0) {
      return fail("Nenhuma cobrança pendente de aprovação", 400);
    }

    // Update all DRAFT billings to PENDING
    await prisma.billing.updateMany({
      where: { status: "DRAFT" },
      data: { status: "PENDING" },
    });

    return ok(null, { message: `${count} cobrança(s) aprovada(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao aprovar cobranças");
  }
}, { permission: "billing:approve" });
