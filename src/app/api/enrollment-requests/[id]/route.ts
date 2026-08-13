import { prisma } from "@/lib/prisma";
import { fail, notFound, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";
import {
  ClassNotFoundError,
  enrollStudent,
  findClassForPlacement,
} from "@/lib/enrollment";
import { requireCurrentAcademicYear } from "@/lib/academic-year";
import { nextStudentId } from "@/lib/identifiers";

// GET - Obter detalhes de uma solicitação específica
export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
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
        return notFound("Solicitação não encontrada");
      }

      return ok(enrollmentRequest);
    } catch (error) {
      return serverError(error, "Erro ao buscar solicitação");
    }
  },
  { permission: "enrollment:read" }
);

// PUT - Aprovar ou Rejeitar solicitação
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      const body = await request.json();
      const { action, rejectionReason, notes } = body;

      const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
        where: { id: id },
      });

      if (!enrollmentRequest) {
        return notFound("Solicitação não encontrada");
      }

      if (
        enrollmentRequest.status !== "PENDING" &&
        enrollmentRequest.status !== "UNDER_REVIEW"
      ) {
        return fail("Esta solicitação já foi processada");
      }

      if (action === "approve") {
        // Aprovar e criar aluno + responsável
        const result = await prisma.$transaction(async (tx) => {
          // 1. Criar usuário para o responsável financeiro
          // One temporary password per account, never shared between them.
          const parentTemporaryPassword = generateTemporaryPassword();
          const studentTemporaryPassword = generateTemporaryPassword();
          const hashedParentPassword = await hashPassword(
            parentTemporaryPassword
          );
          const hashedStudentPassword = await hashPassword(
            studentTemporaryPassword
          );
          const parentUser = await tx.user.create({
            data: {
              email: enrollmentRequest.financialGuardianEmail,
              password: hashedParentPassword,
              role: "PARENT",
              isActive: true,
              mustChangePassword: true,
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

          // 3. Matrícula do aluno, da mesma sequência usada em todo o sistema
          // (este caminho gerava um "STD00001" próprio, escaneando o maior valor).
          const studentId = await nextStudentId(tx);

          // 4. Criar usuário para o aluno
          const studentUser = await tx.user.create({
            data: {
              email: `${studentId.toLowerCase()}@aluno.davilla.local`,
              password: hashedStudentPassword,
              role: "STUDENT",
              isActive: true,
              mustChangePassword: true,
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
              parentId: parent.id,
            },
          });

          // Placement: the request's grade must have a class in the current year.
          const academicYear = await requireCurrentAcademicYear();
          const targetClass = await findClassForPlacement(
            {
              gradeLevel: enrollmentRequest.gradeLevel,
              section: enrollmentRequest.section || "A",
              academicYearId: academicYear.id,
            },
            tx
          );

          if (!targetClass) {
            throw new ClassNotFoundError(
              enrollmentRequest.gradeLevel,
              enrollmentRequest.section || "A",
              academicYear.year
            );
          }

          await enrollStudent(
            { studentId: student.id, classId: targetClass.id },
            tx
          );

          // 6. Criar relacionamento guardian (financeiro)
          await tx.guardianRelationship.create({
            data: {
              studentId: student.id,
              parentId: parent.id,
              guardianType: enrollmentRequest.isSameGuardian
                ? "BOTH"
                : "FINANCIAL",
              isPrimary: true,
              canPickup: true,
            },
          });

          // 7. Se tem responsável pedagógico diferente, criar
          if (
            !enrollmentRequest.isSameGuardian &&
            enrollmentRequest.pedagogicalGuardianCPF
          ) {
            // Verificar se já existe responsável pedagógico
            let pedagogicalParent = await tx.parent.findUnique({
              where: { cpf: enrollmentRequest.pedagogicalGuardianCPF },
            });

            if (!pedagogicalParent) {
              const pedUser = await tx.user.create({
                data: {
                  email:
                    enrollmentRequest.pedagogicalGuardianEmail ||
                    `${enrollmentRequest.pedagogicalGuardianCPF}@parent.school.com`,
                  password: await hashPassword(generateTemporaryPassword()),
                  role: "PARENT",
                  isActive: true,
                  mustChangePassword: true,
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
                guardianType: "PEDAGOGICAL",
                isPrimary: false,
                canPickup: true,
              },
            });
          }

          // 8. Atualizar solicitação
          await tx.enrollmentRequest.update({
            where: { id: id },
            data: {
              status: "APPROVED",
              reviewedBy: user.id,
              reviewedAt: new Date(),
              notes,
              approvedStudentId: student.id,
            },
          });

          return { student, parent };
        });

        await recordAudit({
          action: "enrollment.approve",
          entity: "EnrollmentRequest",
          entityId: id,
          actor: user,
          request,
          after: { studentId: result.student.id, parentId: result.parent.id },
        });

        return ok(result, { message: "Matrícula aprovada com sucesso!" });
      } else if (action === "reject") {
        // Rejeitar solicitação
        await prisma.enrollmentRequest.update({
          where: { id: id },
          data: {
            status: "REJECTED",
            reviewedBy: user.id,
            reviewedAt: new Date(),
            rejectionReason,
            notes,
          },
        });

        await recordAudit({
          action: "enrollment.reject",
          entity: "EnrollmentRequest",
          entityId: id,
          actor: user,
          request,
          after: { rejectionReason },
        });

        return ok(null, { message: "Solicitação rejeitada" });
      } else {
        return fail("Ação inválida");
      }
    } catch (error) {
      return serverError(error, "Erro ao processar solicitação");
    }
  },
  { permission: "enrollment:write" }
);

// DELETE - Cancelar solicitação
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      await prisma.enrollmentRequest.update({
        where: { id: id },
        data: {
          status: "CANCELLED",
        },
      });

      await recordAudit({
        action: "enrollment.cancel",
        entity: "EnrollmentRequest",
        entityId: id,
        actor: user,
        request,
      });

      return ok(null, { message: "Solicitação cancelada" });
    } catch (error) {
      return serverError(error, "Erro ao cancelar solicitação");
    }
  },
  { permission: "enrollment:write" }
);
