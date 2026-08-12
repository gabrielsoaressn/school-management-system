import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single parent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json(
        { message: "Responsável não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: parent });
  } catch (error: any) {
    console.error("Error fetching parent:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar responsável" },
      { status: 500 }
    );
  }
}

// PUT - Update parent
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json(
        { message: "Responsável não encontrado" },
        { status: 404 }
      );
    }

    // Check if CPF is being changed and if it's already in use
    if (cpf && cpf !== existingParent.cpf) {
      const existingCpf = await prisma.parent.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return NextResponse.json(
          { message: "CPF já está cadastrado" },
          { status: 400 }
        );
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

    return NextResponse.json({
      message: "Responsável atualizado com sucesso",
      data: result,
    });
  } catch (error: any) {
    console.error("Error updating parent:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar responsável" },
      { status: 500 }
    );
  }
}

// DELETE - Delete parent
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if parent exists and has students
    const parent = await prisma.parent.findUnique({
      where: { id: id },
      include: {
        students: true,
        user: true,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Responsável não encontrado" },
        { status: 404 }
      );
    }

    if (parent.students.length > 0) {
      return NextResponse.json(
        { message: "Não é possível excluir um responsável com alunos vinculados" },
        { status: 400 }
      );
    }

    // Delete parent (user will be deleted by cascade)
    await prisma.user.delete({
      where: { id: parent.userId },
    });

    return NextResponse.json({
      message: "Responsável excluído com sucesso",
    });
  } catch (error: any) {
    console.error("Error deleting parent:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir responsável" },
      { status: 500 }
    );
  }
}
