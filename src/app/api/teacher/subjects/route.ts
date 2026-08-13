import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { fail, forbidden, notFound, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

/**
 * GET /api/teacher/subjects?classId=... | ?gradeLevel=...
 *
 * Subjects taught in a class, resolved from the class grade level. Scoping to
 * the subjects a teacher is actually assigned to depends on the
 * ClassSubjectTeacher model (phase 4.2); until then any teacher sees every
 * subject of the grade.
 */
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    let gradeLevel = searchParams.get("gradeLevel");

    if (!classId && !gradeLevel) {
      return fail("Informe classId ou gradeLevel");
    }

    if (classId) {
      const schoolClass = await prisma.class.findUnique({
        where: { id: classId },
        select: { gradeLevel: true },
      });

      if (!schoolClass) {
        return notFound("Turma não encontrada");
      }

      gradeLevel = schoolClass.gradeLevel;
    }

    const subjects = await prisma.subject.findMany({
      where: { gradeLevel: gradeLevel! },
      select: { id: true, name: true, code: true, gradeLevel: true },
      orderBy: { name: "asc" },
    });

    return ok(subjects);
  } catch (error) {
    return serverError(error, "Erro ao buscar disciplinas");
  }
}, { roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"], permission: "class:read" });
