import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { created, fail, forbidden, notFound, paginated, serverError, validationFailed } from "@/lib/api-response";

const renegotiationSchema = z.object({
  billingId: z.string(),
  renegotiatedAmount: z.number().min(0),
  discount: z.number().min(0).default(0),
  installments: z.number().int().min(1).default(1),
  newDueDate: z.string().transform((str) => new Date(str)),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// POST - Criar renegociação
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const body = await req.json();
    const validatedData = renegotiationSchema.parse(body);

    // Buscar billing
    const billing = await prisma.billing.findUnique({
      where: { id: validatedData.billingId },
    });

    if (!billing) {
      return notFound('Fatura não encontrada');
    }

    if (billing.status === 'PAID') {
      return fail('Não é possível renegociar uma fatura já paga');
    }

    // Criar renegociação e atualizar billing
    const result = await prisma.$transaction(async (tx) => {
      const renegotiation = await tx.paymentRenegotiation.create({
        data: {
          billingId: validatedData.billingId,
          originalAmount: billing.amount,
          renegotiatedAmount: validatedData.renegotiatedAmount,
          discount: validatedData.discount,
          installments: validatedData.installments,
          newDueDate: validatedData.newDueDate,
          renegotiatedBy: session.user.id,
          reason: validatedData.reason,
          notes: validatedData.notes,
        },
      });

      // Atualizar billing
      await tx.billing.update({
        where: { id: validatedData.billingId },
        data: {
          status: 'RENEGOTIATED',
          amount: validatedData.renegotiatedAmount,
          dueDate: validatedData.newDueDate,
          notes: validatedData.notes
            ? `${billing.notes || ''}\n\n[RENEGOCIADO] ${validatedData.notes}`
            : billing.notes,
        },
      });

      return renegotiation;
    });

    return created(result, { message: 'Renegociação criada com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao criar renegociação');
  }
}

// GET - Listar renegociações
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const billingId = searchParams.get('billingId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (billingId) where.billingId = billingId;

    const [renegotiations, total] = await Promise.all([
      prisma.paymentRenegotiation.findMany({
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
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentRenegotiation.count({ where }),
    ]);

    return paginated(renegotiations, { total: total, page: page, limit: limit });
  } catch (error) {
    return serverError(error, 'Erro ao buscar renegociações');
  }
}
