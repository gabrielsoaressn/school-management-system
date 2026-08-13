import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

    const billings = await prisma.billing.findMany({
      where: {
        status: "DRAFT",
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok(billings);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar cobranças pendentes");
  }
}
