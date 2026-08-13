import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { created, forbidden, paginated, serverError, validationFailed } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

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
export const POST = withAuth(async (request, { user }) => {
  try {

    const body = await request.json();
    const validatedData = occurrenceSchema.parse(body);

    // Nome de quem registrou, para manter o histórico legível
    const reporter = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employee: true,
      },
    });

    const reporterName = reporter?.employee
      ? `${reporter.employee.firstName} ${reporter.employee.lastName}`
      : user.email || 'Sistema';

    const occurrence = await prisma.occurrence.create({
      data: {
        ...validatedData,
        reportedBy: user.id,
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

    // Notifica o responsável vinculado ao aluno
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

    return created(occurrence, { message: 'Ocorrência registrada com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao registrar ocorrência');
  }
}, { permission: "occurrence:write" });

// GET - Listar ocorrências
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
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
    if (user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
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

    return paginated(occurrences, { total: total, page: page, limit: limit });
  } catch (error) {
    return serverError(error, 'Erro ao buscar ocorrências');
  }
}, { permission: "occurrence:read" });
