import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { created, forbidden, paginated, serverError, validationFailed } from "@/lib/api-response";

const announcementSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  targetRole: z.string().optional(),
  targetGrade: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  expiresAt: z.string().transform((str) => new Date(str)).optional(),
  attachmentUrl: z.string().optional(),
});

// POST - Criar aviso
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const body = await req.json();
    const validatedData = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    // Criar notificações para usuários relevantes
    const where: any = { isActive: true };

    if (validatedData.targetRole) {
      where.role = validatedData.targetRole;
    }

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Se houver targetGrade, filtrar apenas alunos daquela série
    let filteredUsers = targetUsers;
    if (validatedData.targetGrade) {
      const studentsInGrade = await prisma.student.findMany({
        where: { gradeLevel: validatedData.targetGrade },
        select: { userId: true },
      });
      const studentUserIds = studentsInGrade.map((s) => s.userId);
      filteredUsers = targetUsers.filter((u) => studentUserIds.includes(u.id));
    }

    // Criar notificações em lote (max 100 por vez para evitar timeout)
    const notifications = filteredUsers.slice(0, 100).map((user) => ({
      userId: user.id,
      title: `📢 ${announcement.title}`,
      message: announcement.content.slice(0, 100) + (announcement.content.length > 100 ? '...' : ''),
      type: 'announcement',
      actionUrl: `/announcements/${announcement.id}`,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return created(announcement, { message: `Aviso publicado para ${filteredUsers.length} usuários!` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao criar aviso');
  }
}

// GET - Listar avisos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const targetRole = searchParams.get('targetRole');
    const targetGrade = searchParams.get('targetGrade');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const where: any = {
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    };

    // Filtrar por role do usuário
    if (targetRole) {
      where.OR = [
        { targetRole: null },
        { targetRole: targetRole },
      ];
    } else if (session.user.role) {
      where.OR = [
        { targetRole: null },
        { targetRole: session.user.role },
      ];
    }

    // Filtrar por série (se for aluno)
    if (session.user.role === 'STUDENT' && !targetGrade) {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
      });

      if (student) {
        where.OR = [
          { targetGrade: null },
          { targetGrade: student.gradeLevel },
        ];
      }
    } else if (targetGrade) {
      where.targetGrade = targetGrade;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginated(announcements, { total: total, page: page, limit: limit });
  } catch (error) {
    return serverError(error, 'Erro ao buscar avisos');
  }
}
