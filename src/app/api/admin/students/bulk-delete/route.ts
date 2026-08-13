import { prisma } from "@/lib/prisma";
import { fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

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

    // Soft delete: the academic and financial history of a student is a legal
    // record. Marking the student hides them everywhere in the app; grades,
    // attendance, invoices and reports stay attached for retention and audit.
    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { deletedAt },
      }),
      prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isActive: false },
      }),
    ]);

    await recordAudit({
      action: "student.delete",
      entity: "Student",
      actor: user,
      request,
      after: {
        ids: studentIds,
        deletedAt,
        deleteAll: !!deleteAll,
        names: students.map((s) => `${s.firstName} ${s.lastName}`),
      },
    });

    return ok(null, { message: `${students.length} aluno(s) excluído(s) com sucesso` });
  } catch (error: any) {
    return serverError(error, "Erro ao excluir alunos");
  }
}, { permission: "student:delete" });
