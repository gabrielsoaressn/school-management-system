import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Bulk delete students
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, deleteAll, search, gradeLevel } = body;

    let studentWhere: any = {};

    if (deleteAll) {
      // Build search filter for deleteAll
      if (search) {
        studentWhere.OR = [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { studentId: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (gradeLevel && gradeLevel !== "ALL") {
        studentWhere.gradeLevel = gradeLevel;
      }
    } else {
      // Use specific IDs
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { message: "IDs de alunos são obrigatórios" },
          { status: 400 }
        );
      }

      studentWhere.id = {
        in: ids,
      };
    }

    // Get students to find their user IDs
    const students = await prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { message: "Nenhum aluno encontrado" },
        { status: 404 }
      );
    }

    const studentIds = students.map((s) => s.id);
    const userIds = students.map((s) => s.userId);

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: {
          studentId: {
            in: studentIds,
          },
        },
      });

      // Delete grades
      await tx.grade.deleteMany({
        where: {
          studentId: {
            in: studentIds,
          },
        },
      });

      // Delete attendance
      await tx.attendance.deleteMany({
        where: {
          studentId: {
            in: studentIds,
          },
        },
      });

      // Delete tuitions
      await tx.tuition.deleteMany({
        where: {
          studentId: {
            in: studentIds,
          },
        },
      });

      // Delete academic reports
      await tx.academicReport.deleteMany({
        where: {
          studentId: {
            in: studentIds,
          },
        },
      });

      // Delete students
      await tx.student.deleteMany({
        where: {
          id: {
            in: studentIds,
          },
        },
      });

      // Delete users
      await tx.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: `${students.length} aluno(s) excluído(s) com sucesso`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk deleting students:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao excluir alunos" },
      { status: 500 }
    );
  }
}
