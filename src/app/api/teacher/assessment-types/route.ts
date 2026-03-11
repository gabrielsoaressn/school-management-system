import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

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

    return NextResponse.json({
      success: true,
      data: assessmentTypes,
    });

  } catch (error) {
    console.error('Error fetching assessment types:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar tipos de avaliação',
    }, { status: 500 });
  }
}

// POST - Criar tipo de avaliação (apenas ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = assessmentTypeSchema.parse(body);

    // Verificar se código já existe
    const existing = await prisma.assessmentType.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Código já está em uso',
      }, { status: 400 });
    }

    const assessmentType = await prisma.assessmentType.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Tipo de avaliação criado com sucesso!',
      data: assessmentType,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      }, { status: 400 });
    }

    console.error('Error creating assessment type:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar tipo de avaliação',
    }, { status: 500 });
  }
}
