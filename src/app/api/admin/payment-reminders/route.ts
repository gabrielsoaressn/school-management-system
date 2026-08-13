import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { created, fail, forbidden, notFound, paginated, serverError, validationFailed } from "@/lib/api-response";

const reminderSchema = z.object({
  billingId: z.string(),
  reminderType: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'SYSTEM']),
  subject: z.string().optional(),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
});

const bulkReminderSchema = z.object({
  billingIds: z.array(z.string()),
  reminderType: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'SYSTEM']),
  subject: z.string().optional(),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
});

// POST - Enviar lembrete (individual ou em lote)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const body = await req.json();

    // Verificar se é envio em lote
    if (body.billingIds && Array.isArray(body.billingIds)) {
      const validatedData = bulkReminderSchema.parse(body);

      // Buscar billings
      const billings = await prisma.billing.findMany({
        where: {
          id: { in: validatedData.billingIds },
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        include: {
          parent: true,
        },
      });

      if (billings.length === 0) {
        return fail('Nenhuma fatura encontrada para enviar lembretes');
      }

      // Criar lembretes em lote
      const reminders = await prisma.$transaction(
        billings.map((billing) =>
          prisma.paymentReminder.create({
            data: {
              billingId: billing.id,
              reminderType: validatedData.reminderType,
              status: 'SENT',
              recipientName: `${billing.parent.firstName} ${billing.parent.lastName}`,
              recipientEmail:
                validatedData.reminderType === 'EMAIL'
                  ? billing.parent.email || ''
                  : undefined,
              recipientPhone:
                validatedData.reminderType === 'WHATSAPP' ||
                validatedData.reminderType === 'SMS'
                  ? billing.parent.whatsappNumber || billing.parent.phoneNumber
                  : undefined,
              subject: validatedData.subject,
              message: validatedData.message
                .replace('{{name}}', billing.parent.firstName)
                .replace('{{amount}}', `R$ ${billing.amount.toFixed(2)}`)
                .replace(
                  '{{dueDate}}',
                  new Date(billing.dueDate).toLocaleDateString('pt-BR')
                ),
              templateUsed: 'default',
              sentAt: new Date(),
            },
          })
        )
      );

      // Simular entrega (em produção, aqui seria a integração real)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Atualizar status para DELIVERED
      await prisma.paymentReminder.updateMany({
        where: {
          id: { in: reminders.map((r) => r.id) },
        },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      return created(reminders, { message: `${reminders.length} lembretes enviados com sucesso!` });
    } else {
      // Envio individual
      const validatedData = reminderSchema.parse(body);

      const billing = await prisma.billing.findUnique({
        where: { id: validatedData.billingId },
        include: { parent: true },
      });

      if (!billing) {
        return notFound('Fatura não encontrada');
      }

      const reminder = await prisma.paymentReminder.create({
        data: {
          billingId: billing.id,
          reminderType: validatedData.reminderType,
          status: 'SENT',
          recipientName: `${billing.parent.firstName} ${billing.parent.lastName}`,
          recipientEmail:
            validatedData.reminderType === 'EMAIL'
              ? billing.parent.email || ''
              : undefined,
          recipientPhone:
            validatedData.reminderType === 'WHATSAPP' ||
            validatedData.reminderType === 'SMS'
              ? billing.parent.whatsappNumber || billing.parent.phoneNumber
              : undefined,
          subject: validatedData.subject,
          message: validatedData.message
            .replace('{{name}}', billing.parent.firstName)
            .replace('{{amount}}', `R$ ${billing.amount.toFixed(2)}`)
            .replace(
              '{{dueDate}}',
              new Date(billing.dueDate).toLocaleDateString('pt-BR')
            ),
          templateUsed: 'default',
          sentAt: new Date(),
        },
      });

      // Simular entrega
      await new Promise((resolve) => setTimeout(resolve, 500));

      await prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      return created(reminder, { message: 'Lembrete enviado com sucesso!' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao enviar lembrete');
  }
}

// GET - Listar lembretes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const billingId = searchParams.get('billingId');
    const status = searchParams.get('status');
    const reminderType = searchParams.get('reminderType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (billingId) where.billingId = billingId;
    if (status) where.status = status;
    if (reminderType) where.reminderType = reminderType;

    const [reminders, total] = await Promise.all([
      prisma.paymentReminder.findMany({
        where,
        skip,
        take: limit,
        include: {
          billing: {
            include: {
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      }),
      prisma.paymentReminder.count({ where }),
    ]);

    return paginated(reminders, { total: total, page: page, limit: limit });
  } catch (error) {
    return serverError(error, 'Erro ao buscar lembretes');
  }
}
