import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Buscar documento específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
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
      return NextResponse.json({
        success: false,
        message: 'Documento não encontrado',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar documento',
    }, { status: 500 });
  }
}
