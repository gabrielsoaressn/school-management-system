import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import {
  created,
  fail,
  forbidden,
  ok,
  serverError,
  validationFailed,
} from "@/lib/api-response";
import { requireCurrentAcademicYear } from "@/lib/academic-year";
import { checkTeachingAssignment } from "@/lib/teaching";
import { parseDate } from "@/lib/datetime";

const scoreEntrySchema = z.object({
  studentId: z.string(),
  score: z.number().min(0),
  remarks: z.string().optional(),
});

const bulkAssessmentSchema = z.object({
  subjectId: z.string(),
  classId: z.string(),
  assessmentTypeId: z.string(),
  term: z.string(),
  maxScore: z.number().default(10),
  assessmentDate: z.string().optional(),
  scores: z.array(scoreEntrySchema).min(1),
});

const singleAssessmentSchema = scoreEntrySchema.extend({
  subjectId: z.string(),
  classId: z.string(),
  assessmentTypeId: z.string(),
  term: z.string(),
  maxScore: z.number().min(0).default(10),
  assessmentDate: z.string().optional(),
});

/** A-F from the percentage of the maximum. */
function calculateGrade(score: number, maxScore: number): string {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

/**
 * POST /api/teacher/assessments — one grade or a whole class at once.
 *
 * Authorization is the teaching assignment, not the role: a teacher may only
 * post grades for a class+subject they are assigned to in the curriculum. The
 * check runs here, so a hand-made request is refused just like the UI.
 *
 * The academic year is resolved server-side from the current year. It used to
 * arrive in the request body, which let the caller write grades into any year.
 */
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = await request.json();

      // Parsed in separate branches so each has a concrete type: the shared
      // shape below is what both forms reduce to.
      const parsed = Array.isArray(body?.scores)
        ? (() => {
            const bulk = bulkAssessmentSchema.parse(body);
            const { scores, ...rest } = bulk;
            return { ...rest, entries: scores };
          })()
        : (() => {
            const single = singleAssessmentSchema.parse(body);
            const { studentId, score, remarks, ...rest } = single;
            return { ...rest, entries: [{ studentId, score, remarks }] };
          })();

      const entries = parsed.entries;

      const assignment = await checkTeachingAssignment(user, {
        classId: parsed.classId,
        subjectId: parsed.subjectId,
      });

      if (!assignment.allowed) {
        return forbidden(assignment.reason);
      }

      const academicYear = await requireCurrentAcademicYear();

      // Grades belong to students actually enrolled in that class this year.
      const enrolled = await prisma.enrollment.findMany({
        where: {
          classId: parsed.classId,
          academicYearId: academicYear.id,
          status: "ACTIVE",
          studentId: { in: entries.map((entry) => entry.studentId) },
        },
        select: { studentId: true },
      });

      const enrolledIds = new Set(enrolled.map((row) => row.studentId));
      const strangers = entries.filter(
        (entry) => !enrolledIds.has(entry.studentId)
      );

      if (strangers.length > 0) {
        return fail(
          `${strangers.length} aluno(s) não estão matriculados nesta turma neste ano letivo`
        );
      }

      const assessmentDate = parsed.assessmentDate
        ? parseDate(parsed.assessmentDate)
        : new Date();

      const saved = await prisma.$transaction(
        entries.map((entry) => {
          const grade = calculateGrade(entry.score, parsed.maxScore);

          return prisma.assessment.upsert({
            where: {
              studentId_subjectId_assessmentTypeId_term_academicYearId: {
                studentId: entry.studentId,
                subjectId: parsed.subjectId,
                assessmentTypeId: parsed.assessmentTypeId,
                term: parsed.term,
                academicYearId: academicYear.id,
              },
            },
            update: {
              score: entry.score,
              maxScore: parsed.maxScore,
              grade,
              remarks: entry.remarks,
              assessmentDate,
              teacherId: assignment.teacherId,
            },
            create: {
              studentId: entry.studentId,
              subjectId: parsed.subjectId,
              classId: parsed.classId,
              assessmentTypeId: parsed.assessmentTypeId,
              academicYearId: academicYear.id,
              teacherId: assignment.teacherId,
              term: parsed.term,
              score: entry.score,
              maxScore: parsed.maxScore,
              grade,
              remarks: entry.remarks,
              assessmentDate,
            },
          });
        })
      );

      return created(saved, {
        message:
          saved.length === 1
            ? "Nota lançada com sucesso!"
            : `${saved.length} notas lançadas com sucesso!`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao lançar nota");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "assessment:write",
  }
);

/**
 * GET /api/teacher/assessments — defaults to the current academic year.
 *
 * A teacher only sees the classes they teach; reading another class returns
 * nothing rather than an error, so the screen degrades quietly.
 */
export const GET = withAuth(
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const classId = searchParams.get("classId");
      const studentId = searchParams.get("studentId");
      const subjectId = searchParams.get("subjectId");
      const term = searchParams.get("term");
      const yearParam = searchParams.get("year");

      const academicYear = yearParam
        ? await prisma.academicYear.findUnique({
            where: { year: Number(yearParam) },
          })
        : await requireCurrentAcademicYear();

      if (!academicYear) {
        return fail("Ano letivo não encontrado", 404);
      }

      if (classId) {
        const assignment = await checkTeachingAssignment(user, {
          classId,
          subjectId,
        });

        if (!assignment.allowed) {
          return forbidden(assignment.reason);
        }
      }

      const assessments = await prisma.assessment.findMany({
        where: {
          academicYearId: academicYear.id,
          ...(classId ? { classId } : {}),
          ...(studentId ? { studentId } : {}),
          ...(subjectId ? { subjectId } : {}),
          ...(term ? { term } : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
          subject: { select: { id: true, name: true, code: true } },
          assessmentType: {
            select: {
              id: true,
              name: true,
              code: true,
              weight: true,
              maxScore: true,
            },
          },
          class: {
            select: { id: true, name: true, gradeLevel: true, section: true },
          },
        },
        orderBy: [{ term: "desc" }, { assessmentDate: "desc" }],
      });

      return ok(assessments);
    } catch (error) {
      return serverError(error, "Erro ao buscar avaliações");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "assessment:read",
  }
);
