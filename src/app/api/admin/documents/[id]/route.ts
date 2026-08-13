import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { forbidden, notFound, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - Buscar documento específico
export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

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
}, { permission: "document:read" });
