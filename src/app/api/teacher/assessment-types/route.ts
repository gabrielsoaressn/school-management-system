import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { created, fail, forbidden, ok, serverError, validationFailed } from "@/lib/api-response";

const assessmentTypeSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  weight: z.number().min(0).default(1.0),
  maxScore: z.number().min(0).default(10.0),
  description: z.string().optional(),
});

// GET - Listar tipos de avaliação
export async function GET(req: NextRequest) {
  try {
    const assessmentTypes = await prisma.assessmentType.findMany({
      orderBy: { name: 'asc' },
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
    return serverError(error, 'Erro ao buscar tipos de avaliação');
  }
}

// POST - Criar tipo de avaliação (apenas ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const body = await req.json();
    const validatedData = assessmentTypeSchema.parse(body);

    // Verificar se código já existe
    const existing = await prisma.assessmentType.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return fail('Código já está em uso');
    }

    const assessmentType = await prisma.assessmentType.create({
      data: validatedData,
    });

    return created(assessmentType, { message: 'Tipo de avaliação criado com sucesso!' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao criar tipo de avaliação');
  }
}
