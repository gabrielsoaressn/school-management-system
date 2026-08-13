import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { created, fail, paginated, serverError, validationFailed } from "@/lib/api-response";
import { withAuth, withoutAuth } from "@/lib/api-auth";
import { clientIp, looksLikeBot, rateLimit } from "@/lib/rate-limit";

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

  // Consentimento LGPD: obrigatório, registrado com data e versão do texto
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'É necessário concordar com o uso dos dados' }),
  }),
  consentVersion: z.string().min(1),

  // Documentos (URLs temporárias de upload)
  birthCertificateUrl: z.string().optional(),
  cpfUrl: z.string().optional(),
  proofOfAddressUrl: z.string().optional(),
  previousSchoolUrl: z.string().optional(),
});

// POST - Criar nova solicitação de matrícula (rota pública)
export const POST = withoutAuth(async (request) => {
  try {
    // Public endpoint: throttle per address before touching the database.
    const limit = rateLimit(`enrollment:${clientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return fail(
        'Muitas solicitações enviadas. Tente novamente mais tarde.',
        429
      );
    }

    const body = await request.json();

    if (looksLikeBot(body)) {
      // Hidden field filled: drop it as invalid without describing the check.
      return fail('Dados inválidos');
    }

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
    const { consentGiven, consentVersion, ...requestData } = validatedData;

    const enrollmentRequest = await prisma.enrollmentRequest.create({
      data: {
        requestNumber,
        status: 'PENDING',
        ...requestData,
        consentGivenAt: new Date(),
        consentVersion,
      },
    });

    return created({
        requestNumber: enrollmentRequest.requestNumber,
        id: enrollmentRequest.id,
      }, { message: 'Solicitação de matrícula criada com sucesso!' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao criar solicitação de matrícula');
  }
});

// GET - Listar solicitações (com filtros)
export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
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

    return paginated(requests, { total: total, page: page, limit: limit });

  } catch (error) {
    return serverError(error, 'Erro ao buscar solicitações');
  }
}, { permission: "enrollment:read" });
