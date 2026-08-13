import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}
