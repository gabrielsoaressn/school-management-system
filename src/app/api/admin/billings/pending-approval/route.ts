import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(
  async (_request) => {
    try {
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
  },
  { permission: "billing:approve" }
);
