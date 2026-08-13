import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// POST - Bulk delete students
export const POST = withAuth(async (request, { user }) => {
  try {

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
        return fail("IDs de alunos são obrigatórios", 400);
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
      return fail("Nenhum aluno encontrado", 404);
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

    return ok(null, { message: `${students.length} aluno(s) excluído(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir alunos");
  }
}, { permission: "student:delete" });
