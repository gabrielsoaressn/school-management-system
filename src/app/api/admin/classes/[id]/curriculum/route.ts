import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import {
  fail,
  notFound,
  ok,
  serverError,
  validationFailed,
} from "@/lib/api-response";
import { recordAudit } from "@/lib/audit";

const assignmentSchema = z.object({
  subjectId: z.string(),
  /** null clears the staffing, leaving the subject on the curriculum. */
  teacherId: z.string().nullable(),
  weeklyPeriods: z.number().int().min(0).max(40).nullable().optional(),
});

const putSchema = z.object({
  assignments: z.array(assignmentSchema),
});

/**
 * GET — the class's curriculum, plus what is available to put on it.
 *
 * Returns the subjects of the class's grade level and the teachers qualified for
 * each, so the screen can offer a sensible choice rather than every employee.
 */
export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    try {
      const { id } = await params;

      const schoolClass = await prisma.class.findUnique({
        where: { id },
        include: {
          academicYear: true,
          assignments: {
            include: {
              subject: true,
              teacher: { include: { employee: true } },
            },
            orderBy: { subject: { name: "asc" } },
          },
          _count: { select: { enrollments: true } },
        },
      });

      if (!schoolClass) {
        return notFound("Turma não encontrada");
      }

      const gradeSubjects = await prisma.subject.findMany({
        where: { gradeLevel: schoolClass.gradeLevel },
        include: {
          teachers: {
            include: { teacher: { include: { employee: true } } },
          },
        },
        orderBy: { name: "asc" },
      });

      const subjects = gradeSubjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        qualifiedTeachers: subject.teachers
          .filter((link) => link.teacher.employee.deletedAt === null)
          .map((link) => ({
            id: link.teacher.id,
            name: `${link.teacher.employee.firstName} ${link.teacher.employee.lastName}`,
          })),
      }));

      return ok({
        class: {
          id: schoolClass.id,
          name: schoolClass.name,
          gradeLevel: schoolClass.gradeLevel,
          section: schoolClass.section,
          roomNumber: schoolClass.roomNumber,
          schedule: schoolClass.schedule,
          capacity: schoolClass.capacity,
          academicYear: schoolClass.academicYear.year,
          studentCount: schoolClass._count.enrollments,
        },
        assignments: schoolClass.assignments.map((assignment) => ({
          id: assignment.id,
          subjectId: assignment.subjectId,
          subjectName: assignment.subject.name,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacher
            ? `${assignment.teacher.employee.firstName} ${assignment.teacher.employee.lastName}`
            : null,
          weeklyPeriods: assignment.weeklyPeriods,
        })),
        subjects,
      });
    } catch (error) {
      return serverError(error, "Erro ao buscar a grade da turma");
    }
  },
  { permission: "class:read" }
);

/**
 * PUT — replaces the class's curriculum with the list given.
 *
 * A subject dropped from the list is removed from the curriculum, which also
 * withdraws that teacher's authority to enter grades for it. Removal is refused
 * while assessments or register entries exist for the pair: the history would
 * become unreachable.
 */
export const PUT = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { assignments } = putSchema.parse(body);

      const schoolClass = await prisma.class.findUnique({
        where: { id },
        include: { assignments: true },
      });

      if (!schoolClass) {
        return notFound("Turma não encontrada");
      }

      const wanted = new Map(
        assignments.map((assignment) => [assignment.subjectId, assignment])
      );

      // Subjects must belong to the class's grade level.
      const validSubjects = await prisma.subject.findMany({
        where: {
          id: { in: [...wanted.keys()] },
          gradeLevel: schoolClass.gradeLevel,
        },
        select: { id: true },
      });

      if (validSubjects.length !== wanted.size) {
        return fail(
          `Uma ou mais disciplinas não pertencem a ${schoolClass.gradeLevel}`
        );
      }

      const removed = schoolClass.assignments.filter(
        (assignment) => !wanted.has(assignment.subjectId)
      );

      for (const assignment of removed) {
        const [assessments, attendance] = await Promise.all([
          prisma.assessment.count({
            where: { classId: id, subjectId: assignment.subjectId },
          }),
          prisma.attendanceRecord.count({
            where: { classId: id, subjectId: assignment.subjectId },
          }),
        ]);

        if (assessments > 0 || attendance > 0) {
          const subject = await prisma.subject.findUnique({
            where: { id: assignment.subjectId },
            select: { name: true },
          });

          return fail(
            `Não é possível remover ${subject?.name ?? "a disciplina"}: existem ` +
              `${assessments} nota(s) e ${attendance} registro(s) de frequência lançados.`
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        if (removed.length > 0) {
          await tx.classSubjectTeacher.deleteMany({
            where: { id: { in: removed.map((assignment) => assignment.id) } },
          });
        }

        for (const assignment of wanted.values()) {
          await tx.classSubjectTeacher.upsert({
            where: {
              classId_subjectId: {
                classId: id,
                subjectId: assignment.subjectId,
              },
            },
            update: {
              teacherId: assignment.teacherId,
              weeklyPeriods: assignment.weeklyPeriods ?? null,
            },
            create: {
              classId: id,
              subjectId: assignment.subjectId,
              teacherId: assignment.teacherId,
              academicYearId: schoolClass.academicYearId,
              weeklyPeriods: assignment.weeklyPeriods ?? null,
            },
          });
        }
      });

      await recordAudit({
        action: "class.curriculum_update",
        entity: "Class",
        entityId: id,
        actor: user,
        request,
        before: {
          assignments: schoolClass.assignments.map((assignment) => ({
            subjectId: assignment.subjectId,
            teacherId: assignment.teacherId,
          })),
        },
        after: { assignments },
      });

      return ok(null, { message: "Grade da turma atualizada" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao atualizar a grade da turma");
    }
  },
  { permission: "class:write" }
);
