import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  created,
  fail,
  ok,
  serverError,
  validationFailed,
} from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

const assessmentTypeSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  code: z.string().min(1, "Código é obrigatório"),
  weight: z.number().min(0).default(1.0),
  maxScore: z.number().min(0).default(10.0),
  description: z.string().optional(),
});

// GET - Listar tipos de avaliação
export const GET = withAuth(
  async (_request) => {
    try {
      const assessmentTypes = await prisma.assessmentType.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              assessments: true,
            },
          },
        },
      });

      return ok(assessmentTypes);
    } catch (error) {
      return serverError(error, "Erro ao buscar tipos de avaliação");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "assessment:read",
  }
);

// POST - Criar tipo de avaliação (apenas ADMIN)
export const POST = withAuth(
  async (request) => {
    try {
      const body = await request.json();
      const validatedData = assessmentTypeSchema.parse(body);

      // Verificar se código já existe
      const existing = await prisma.assessmentType.findUnique({
        where: { code: validatedData.code },
      });

      if (existing) {
        return fail("Código já está em uso");
      }

      const assessmentType = await prisma.assessmentType.create({
        data: validatedData,
      });

      return created(assessmentType, {
        message: "Tipo de avaliação criado com sucesso!",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao criar tipo de avaliação");
    }
  },
  { roles: ["ADMIN", "COORDINATOR"] }
);
