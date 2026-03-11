import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const occurrenceSchema = z.object({
  studentId: z.string(),
  type: z.enum(['BEHAVIORAL', 'ACADEMIC', 'HEALTH', 'ATTENDANCE', 'POSITIVE', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  actionTaken: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

// POST - Criar ocorrência
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = occurrenceSchema.parse(body);

    // Buscar informações do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: true,
      },
    });

    const reporterName = user?.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : session.user.email || 'Sistema';

    const occurrence = await prisma.occurrence.create({
      data: {
        ...validatedData,
        reportedBy: session.user.id,
        reportedByName: reporterName,
        parentNotified: false,
      },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    // TODO: Criar notificação para o responsável
    if (occurrence.student.parent) {
      await prisma.notification.create({
        data: {
          userId: occurrence.student.parent.userId,
          title: `Nova Ocorrência: ${occurrence.title}`,
          message: occurrence.description,
          type: 'occurrence',
          actionUrl: `/parent/occurrences/${occurrence.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Ocorrência registrada com sucesso!',
      data: occurrence,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      }, { status: 400 });
    }

    console.error('Error creating occurrence:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao registrar ocorrência',
    }, { status: 500 });
  }
}

// GET - Listar ocorrências
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    // Se for responsável, mostrar apenas ocorrências dos filhos
    if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { students: true },
      });

      if (parent) {
        where.studentId = { in: parent.students.map((s) => s.id) };
      }
    }

    const [occurrences, total] = await Promise.all([
      prisma.occurrence.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.occurrence.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: occurrences,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching occurrences:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar ocorrências',
    }, { status: 500 });
  }
}
