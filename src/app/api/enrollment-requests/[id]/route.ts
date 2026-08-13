import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { fail, forbidden, notFound, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - Obter detalhes de uma solicitação específica
export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;
    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: id },
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
      return notFound('Solicitação não encontrada');
    }

    return ok(enrollmentRequest);

  } catch (error) {
    return serverError(error, 'Erro ao buscar solicitação');
  }
}, { permission: "enrollment:read" });

// PUT - Aprovar ou Rejeitar solicitação
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    const body = await request.json();
    const { action, rejectionReason, notes } = body;

    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: id },
    });

    if (!enrollmentRequest) {
      return notFound('Solicitação não encontrada');
    }

    if (enrollmentRequest.status !== 'PENDING' && enrollmentRequest.status !== 'UNDER_REVIEW') {
      return fail('Esta solicitação já foi processada');
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
          where: { id: id },
          data: {
            status: 'APPROVED',
            reviewedBy: user.id,
            reviewedAt: new Date(),
            notes,
            approvedStudentId: student.id,
          },
        });

        return { student, parent };
      });

      return ok(result, { message: 'Matrícula aprovada com sucesso!' });

    } else if (action === 'reject') {
      // Rejeitar solicitação
      await prisma.enrollmentRequest.update({
        where: { id: id },
        data: {
          status: 'REJECTED',
          reviewedBy: user.id,
          reviewedAt: new Date(),
          rejectionReason,
          notes,
        },
      });

      return ok(null, { message: 'Solicitação rejeitada' });

    } else {
      return fail('Ação inválida');
    }

  } catch (error) {
    return serverError(error, 'Erro ao processar solicitação');
  }
}, { permission: "enrollment:write" });

// DELETE - Cancelar solicitação
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    await prisma.enrollmentRequest.update({
      where: { id: id },
      data: {
        status: 'CANCELLED',
      },
    });

    return ok(null, { message: 'Solicitação cancelada' });

  } catch (error) {
    return serverError(error, 'Erro ao cancelar solicitação');
  }
}, { permission: "enrollment:write" });
