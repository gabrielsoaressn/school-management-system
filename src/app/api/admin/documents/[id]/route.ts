import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { forbidden, notFound, ok, serverError } from "@/lib/api-response";

// GET - Buscar documento específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return forbidden();
    }

    const document = await prisma.generatedDocument.findUnique({
      where: { id: id },
      include: {
        template: true,
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!document) {
      return notFound('Documento não encontrado');
    }

    return ok(document);
  } catch (error) {
    return serverError(error, 'Erro ao buscar documento');
  }
}
