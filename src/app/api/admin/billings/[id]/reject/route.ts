import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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

    return ok(null, { message: "Cobrança rejeitada e cancelada" });
  } catch (error: any) {
    return serverError(error, "Erro ao rejeitar cobrança");
  }
}
