import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Obter detalhes de uma solicitação específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: params.id },
      include: {
        approvedStudent: {
          include: {
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!enrollmentRequest) {
      return NextResponse.json({
        success: false,
        message: 'Solicitação não encontrada',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: enrollmentRequest,
    });

  } catch (error) {
    console.error('Error fetching enrollment request:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar solicitação',
    }, { status: 500 });
  }
}

// PUT - Aprovar ou Rejeitar solicitação
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const body = await req.json();
    const { action, rejectionReason, notes } = body;

    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: params.id },
    });

    if (!enrollmentRequest) {
      return NextResponse.json({
        success: false,
        message: 'Solicitação não encontrada',
      }, { status: 404 });
    }

    if (enrollmentRequest.status !== 'PENDING' && enrollmentRequest.status !== 'UNDER_REVIEW') {
      return NextResponse.json({
        success: false,
        message: 'Esta solicitação já foi processada',
      }, { status: 400 });
    }

    if (action === 'approve') {
      // Aprovar e criar aluno + responsável
      const result = await prisma.$transaction(async (tx) => {
        // 1. Criar usuário para o responsável financeiro
        const hashedPassword = await bcrypt.hash('senha123', 10);
        const parentUser = await tx.user.create({
          data: {
            email: enrollmentRequest.financialGuardianEmail,
            password: hashedPassword,
            role: 'PARENT',
            isActive: true,
          },
        });

        // 2. Criar responsável
        const parent = await tx.parent.create({
          data: {
            userId: parentUser.id,
            firstName: enrollmentRequest.financialGuardianFirstName,
            lastName: enrollmentRequest.financialGuardianLastName,
            phoneNumber: enrollmentRequest.financialGuardianPhone,
            address: enrollmentRequest.address,
            cpf: enrollmentRequest.financialGuardianCPF,
            email: enrollmentRequest.financialGuardianEmail,
            whatsappNumber: enrollmentRequest.financialGuardianPhone,
          },
        });

        // 3. Gerar studentId único
        const lastStudent = await tx.student.findFirst({
          orderBy: { studentId: 'desc' },
          select: { studentId: true },
        });

        let nextStudentNumber = 1;
        if (lastStudent?.studentId) {
          const match = lastStudent.studentId.match(/STD(\d+)/);
          if (match) {
            nextStudentNumber = parseInt(match[1]) + 1;
          }
        }

        const studentId = `STD${String(nextStudentNumber).padStart(5, '0')}`;

        // 4. Criar usuário para o aluno
        const studentUser = await tx.user.create({
          data: {
            email: `${studentId.toLowerCase()}@student.school.com`,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: true,
          },
        });

        // 5. Criar aluno
        const student = await tx.student.create({
          data: {
            studentId,
            userId: studentUser.id,
            firstName: enrollmentRequest.studentFirstName,
            lastName: enrollmentRequest.studentLastName,
            dateOfBirth: enrollmentRequest.dateOfBirth,
            gender: enrollmentRequest.gender,
            address: enrollmentRequest.address,
            phoneNumber: enrollmentRequest.financialGuardianPhone,
            gradeLevel: enrollmentRequest.gradeLevel,
            section: enrollmentRequest.section || 'A',
            parentId: parent.id,
          },
        });

        // 6. Criar relacionamento guardian (financeiro)
        await tx.guardianRelationship.create({
          data: {
            studentId: student.id,
            parentId: parent.id,
            guardianType: enrollmentRequest.isSameGuardian ? 'BOTH' : 'FINANCIAL',
            isPrimary: true,
            canPickup: true,
          },
        });

        // 7. Se tem responsável pedagógico diferente, criar
        if (!enrollmentRequest.isSameGuardian && enrollmentRequest.pedagogicalGuardianCPF) {
          // Verificar se já existe responsável pedagógico
          let pedagogicalParent = await tx.parent.findUnique({
            where: { cpf: enrollmentRequest.pedagogicalGuardianCPF },
          });

          if (!pedagogicalParent) {
            const pedUser = await tx.user.create({
              data: {
                email: enrollmentRequest.pedagogicalGuardianEmail || `${enrollmentRequest.pedagogicalGuardianCPF}@parent.school.com`,
                password: hashedPassword,
                role: 'PARENT',
                isActive: true,
              },
            });

            pedagogicalParent = await tx.parent.create({
              data: {
                userId: pedUser.id,
                firstName: enrollmentRequest.pedagogicalGuardianFirstName!,
                lastName: enrollmentRequest.pedagogicalGuardianLastName!,
                phoneNumber: enrollmentRequest.pedagogicalGuardianPhone!,
                address: enrollmentRequest.address,
                cpf: enrollmentRequest.pedagogicalGuardianCPF,
                email: enrollmentRequest.pedagogicalGuardianEmail,
                whatsappNumber: enrollmentRequest.pedagogicalGuardianPhone,
              },
            });
          }

          await tx.guardianRelationship.create({
            data: {
              studentId: student.id,
              parentId: pedagogicalParent.id,
              guardianType: 'PEDAGOGICAL',
              isPrimary: false,
              canPickup: true,
            },
          });
        }

        // 8. Atualizar solicitação
        await tx.enrollmentRequest.update({
          where: { id: params.id },
          data: {
            status: 'APPROVED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            notes,
            approvedStudentId: student.id,
          },
        });

        return { student, parent };
      });

      return NextResponse.json({
        success: true,
        message: 'Matrícula aprovada com sucesso!',
        data: result,
      });

    } else if (action === 'reject') {
      // Rejeitar solicitação
      await prisma.enrollmentRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectionReason,
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Solicitação rejeitada',
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Ação inválida',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing enrollment request:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE - Cancelar solicitação
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    await prisma.enrollmentRequest.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação cancelada',
    });

  } catch (error) {
    console.error('Error cancelling enrollment request:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao cancelar solicitação',
    }, { status: 500 });
  }
}
