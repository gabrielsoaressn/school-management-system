import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const generateDocumentSchema = z.object({
  studentId: z.string(),
  documentType: z.enum([
    'ENROLLMENT_DECLARATION',
    'SERVICE_CONTRACT',
    'ACADEMIC_TRANSCRIPT',
    'CONDUCT_CERTIFICATE',
    'ENROLLMENT_CERTIFICATE',
  ]),
  additionalData: z.record(z.string()).optional(),
});

// POST - Gerar documento
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = generateDocumentSchema.parse(body);

    // Buscar dados do aluno
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        user: true,
        parent: true,
        enrollments: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Aluno não encontrado',
      }, { status: 404 });
    }

    // Buscar ou criar template
    let template = await prisma.documentTemplate.findFirst({
      where: {
        type: validatedData.documentType,
        isActive: true,
      },
    });

    if (!template) {
      // Criar template padrão se não existir
      template = await createDefaultTemplate(validatedData.documentType);
    }

    // Gerar HTML do documento
    const htmlContent = generateHTMLFromTemplate(template.htmlTemplate, {
      studentName: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId,
      dateOfBirth: new Date(student.dateOfBirth).toLocaleDateString('pt-BR'),
      gradeLevel: student.gradeLevel,
      section: student.section,
      enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString('pt-BR'),
      parentName: student.parent
        ? `${student.parent.firstName} ${student.parent.lastName}`
        : 'Não informado',
      parentCPF: student.parent?.cpf || 'Não informado',
      currentDate: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      schoolName: 'Escola Davilla',
      ...validatedData.additionalData,
    });

    // Salvar documento gerado
    const generatedDocument = await prisma.generatedDocument.create({
      data: {
        templateId: template.id,
        studentId: validatedData.studentId,
        type: validatedData.documentType,
        generatedHtml: htmlContent,
        generatedBy: session.user.id,
        metadata: JSON.stringify(validatedData.additionalData || {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento gerado com sucesso!',
      data: {
        id: generatedDocument.id,
        html: htmlContent,
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

    console.error('Error generating document:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao gerar documento',
    }, { status: 500 });
  }
}

// Função para criar templates padrão
async function createDefaultTemplate(type: string) {
  const templates: Record<string, { name: string; html: string; vars: string }> = {
    ENROLLMENT_DECLARATION: {
      name: 'Declaração de Matrícula',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e40af; margin-bottom: 10px;">{{schoolName}}</h1>
            <h2 style="color: #64748b;">DECLARAÇÃO DE MATRÍCULA</h2>
          </div>

          <div style="text-align: justify; line-height: 1.8; margin-bottom: 40px;">
            <p>Declaramos para os devidos fins que <strong>{{studentName}}</strong>, portador(a) do documento de identidade nº <strong>{{studentId}}</strong>, nascido(a) em <strong>{{dateOfBirth}}</strong>, encontra-se regularmente matriculado(a) nesta instituição de ensino, cursando o <strong>{{gradeLevel}}</strong>, turma <strong>{{section}}</strong>, no ano letivo de <strong>{{currentYear}}</strong>.</p>

            <p>A matrícula foi efetivada em <strong>{{enrollmentDate}}</strong>, e o(a) aluno(a) está apto(a) a frequentar as aulas regularmente.</p>

            <p>Esta declaração é válida para fins de comprovação acadêmica.</p>
          </div>

          <div style="margin-top: 60px;">
            <p style="text-align: center;">{{schoolName}}</p>
            <p style="text-align: center; color: #64748b;">{{currentDate}}</p>

            <div style="margin-top: 80px; text-align: center;">
              <div style="border-top: 1px solid #000; width: 300px; margin: 0 auto; padding-top: 10px;">
                Assinatura da Secretaria
              </div>
            </div>
          </div>
        </div>
      `,
      vars: 'studentName, studentId, dateOfBirth, gradeLevel, section, enrollmentDate, currentDate, schoolName, currentYear',
    },
    SERVICE_CONTRACT: {
      name: 'Contrato de Prestação de Serviços',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e40af;">{{schoolName}}</h1>
            <h2 style="color: #64748b;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h2>
          </div>

          <div style="text-align: justify; line-height: 1.8;">
            <p><strong>CONTRATANTE:</strong> {{parentName}}, CPF nº {{parentCPF}}, residente e domiciliado conforme cadastro.</p>

            <p><strong>CONTRATADA:</strong> {{schoolName}}, instituição de ensino devidamente registrada.</p>

            <p><strong>OBJETO:</strong> A CONTRATADA se compromete a prestar serviços educacionais ao(à) aluno(a) <strong>{{studentName}}</strong>, matriculado(a) no <strong>{{gradeLevel}}</strong>, turma <strong>{{section}}</strong>.</p>

            <h3 style="color: #1e40af; margin-top: 30px;">CLÁUSULA PRIMEIRA - DOS SERVIÇOS</h3>
            <p>Os serviços educacionais incluem aulas regulares, atividades pedagógicas, avaliações e demais atividades previstas no plano pedagógico da instituição.</p>

            <h3 style="color: #1e40af; margin-top: 30px;">CLÁUSULA SEGUNDA - DO VALOR</h3>
            <p>O valor da mensalidade escolar será informado conforme tabela vigente no momento da matrícula, com vencimento no dia 10 de cada mês.</p>

            <h3 style="color: #1e40af; margin-top: 30px;">CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
            <p>O CONTRATANTE se compromete a:</p>
            <ul>
              <li>Efetuar o pagamento das mensalidades nos prazos estabelecidos;</li>
              <li>Manter atualizados os dados cadastrais;</li>
              <li>Acompanhar o desempenho escolar do aluno;</li>
              <li>Respeitar as normas da instituição.</li>
            </ul>

            <h3 style="color: #1e40af; margin-top: 30px;">CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA</h3>
            <p>A CONTRATADA se compromete a:</p>
            <ul>
              <li>Prestar serviços educacionais de qualidade;</li>
              <li>Manter infraestrutura adequada;</li>
              <li>Comunicar aos pais sobre o desempenho do aluno;</li>
              <li>Cumprir o calendário escolar.</li>
            </ul>
          </div>

          <div style="margin-top: 60px;">
            <p style="text-align: right; color: #64748b;">{{currentDate}}</p>

            <div style="display: flex; justify-content: space-between; margin-top: 80px;">
              <div style="text-align: center; width: 45%;">
                <div style="border-top: 1px solid #000; padding-top: 10px;">
                  Contratante
                </div>
              </div>
              <div style="text-align: center; width: 45%;">
                <div style="border-top: 1px solid #000; padding-top: 10px;">
                  Contratada
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      vars: 'studentName, studentId, gradeLevel, section, parentName, parentCPF, currentDate, schoolName',
    },
  };

  const templateData = templates[type] || templates.ENROLLMENT_DECLARATION;

  return await prisma.documentTemplate.create({
    data: {
      name: templateData.name,
      type: type as any,
      htmlTemplate: templateData.html,
      availableVariables: templateData.vars,
      isActive: true,
    },
  });
}

// Função para substituir variáveis no template
function generateHTMLFromTemplate(template: string, data: Record<string, string>) {
  let html = template;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
  });

  // Adicionar ano atual
  html = html.replace(/{{currentYear}}/g, new Date().getFullYear().toString());

  return html;
}
