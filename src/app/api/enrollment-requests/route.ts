import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const enrollmentRequestSchema = z.object({
  // Dados do Aluno
  studentFirstName: z.string().min(2, 'Nome do aluno é obrigatório'),
  studentLastName: z.string().min(2, 'Sobrenome do aluno é obrigatório'),
  dateOfBirth: z.string().transform(str => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  gradeLevel: z.string().min(1, 'Série é obrigatória'),
  section: z.string().optional(),

  // Dados do Responsável Financeiro
  financialGuardianFirstName: z.string().min(2, 'Nome do responsável financeiro é obrigatório'),
  financialGuardianLastName: z.string().min(2, 'Sobrenome do responsável financeiro é obrigatório'),
  financialGuardianCPF: z.string().min(11, 'CPF inválido'),
  financialGuardianPhone: z.string().min(10, 'Telefone inválido'),
  financialGuardianEmail: z.string().email('E-mail inválido'),

  // Dados do Responsável Pedagógico
  isSameGuardian: z.boolean().default(false),
  pedagogicalGuardianFirstName: z.string().optional(),
  pedagogicalGuardianLastName: z.string().optional(),
  pedagogicalGuardianCPF: z.string().optional(),
  pedagogicalGuardianPhone: z.string().optional(),
  pedagogicalGuardianEmail: z.string().email().optional().or(z.literal('')),

  // Endereço
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),

  // Documentos (URLs temporárias de upload)
  birthCertificateUrl: z.string().optional(),
  cpfUrl: z.string().optional(),
  proofOfAddressUrl: z.string().optional(),
  previousSchoolUrl: z.string().optional(),
});

// POST - Criar nova solicitação de matrícula
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = enrollmentRequestSchema.parse(body);

    // Gerar número único de solicitação
    const year = new Date().getFullYear();
    const lastRequest = await prisma.enrollmentRequest.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { requestNumber: true },
    });

    let nextNumber = 1;
    if (lastRequest?.requestNumber) {
      const match = lastRequest.requestNumber.match(/MAT-(\d+)-(\d+)/);
      if (match && match[1] === year.toString()) {
        nextNumber = parseInt(match[2]) + 1;
      }
    }

    const requestNumber = `MAT-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Criar solicitação
    const enrollmentRequest = await prisma.enrollmentRequest.create({
      data: {
        requestNumber,
        status: 'PENDING',
        ...validatedData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de matrícula criada com sucesso!',
      data: {
        requestNumber: enrollmentRequest.requestNumber,
        id: enrollmentRequest.id,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      }, { status: 400 });
    }

    console.error('Error creating enrollment request:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar solicitação de matrícula',
    }, { status: 500 });
  }
}

// GET - Listar solicitações (com filtros)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { studentFirstName: { contains: search, mode: 'insensitive' } },
        { studentLastName: { contains: search, mode: 'insensitive' } },
        { financialGuardianFirstName: { contains: search, mode: 'insensitive' } },
        { financialGuardianLastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.enrollmentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          approvedStudent: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.enrollmentRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar solicitações',
    }, { status: 500 });
  }
}
