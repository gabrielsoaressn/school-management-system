import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - Get single parent
export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    const parent = await prisma.parent.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        students: {
          include: {
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
        billings: {
          orderBy: {
            dueDate: "desc",
          },
          take: 10,
        },
      },
    });

    if (!parent) {
      return fail("Responsável não encontrado", 404);
    }

    return ok(parent);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar responsável");
  }
}, { permission: "parent:read" });

// PUT - Update parent
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    const body = await request.json();
    const {
      firstName,
      lastName,
      phoneNumber,
      address,
      occupation,
      cpf,
      additionalEmail,
      isActive,
    } = body;

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: id },
      include: { user: true },
    });

    if (!existingParent) {
      return fail("Responsável não encontrado", 404);
    }

    // Check if CPF is being changed and if it's already in use
    if (cpf && cpf !== existingParent.cpf) {
      const existingCpf = await prisma.parent.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return fail("CPF já está cadastrado", 400);
      }
    }

    // Update parent and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update parent
      const updatedParent = await tx.parent.update({
        where: { id: id },
        data: {
          firstName,
          lastName,
          phoneNumber,
          address,
          occupation,
          cpf,
          email: additionalEmail,
        },
      });

      // Update user status if provided
      if (typeof isActive !== "undefined") {
        await tx.user.update({
          where: { id: existingParent.userId },
          data: { isActive },
        });
      }

      return updatedParent;
    });

    return ok(result, { message: "Responsável atualizado com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao atualizar responsável");
  }
}, { permission: "parent:write" });

// DELETE - Delete parent
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (request, { params, user }) => {
  try {
    const { id } = await params;

    // Check if parent exists and has students
    const parent = await prisma.parent.findUnique({
      where: { id: id },
      include: {
        students: true,
        user: true,
      },
    });

    if (!parent) {
      return fail("Responsável não encontrado", 404);
    }

    if (parent.students.length > 0) {
      return fail("Não é possível excluir um responsável com alunos vinculados", 400);
    }

    // Delete parent (user will be deleted by cascade)
    await prisma.user.delete({
      where: { id: parent.userId },
    });

    return ok(null, { message: "Responsável excluído com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir responsável");
  }
}, { permission: "parent:delete" });
