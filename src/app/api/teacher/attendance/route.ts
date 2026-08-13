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

const statusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

const entrySchema = z.object({
  studentId: z.string(),
  status: statusSchema,
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  classId: z.string(),
  subjectId: z.string().optional(),
  date: z.string(),
  records: z.array(entrySchema).min(1),
});

const singleAttendanceSchema = entrySchema.extend({
  classId: z.string(),
  subjectId: z.string().optional(),
  date: z.string(),
});

/**
 * POST /api/teacher/attendance — the class register, one entry or the whole class.
 *
 * Authorized by the teaching assignment rather than the role, and scoped to the
 * current academic year. The date is parsed in the school's timezone: a register
 * entry is a calendar day, not an instant.
 */
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = await request.json();

      const parsed = Array.isArray(body?.records)
        ? (() => {
            const bulk = bulkAttendanceSchema.parse(body);
            const { records, ...rest } = bulk;
            return { ...rest, entries: records };
          })()
        : (() => {
            const single = singleAttendanceSchema.parse(body);
            const { studentId, status, remarks, ...rest } = single;
            return { ...rest, entries: [{ studentId, status, remarks }] };
          })();

      const entries = parsed.entries;

      const assignment = await checkTeachingAssignment(user, {
        classId: parsed.classId,
        subjectId: parsed.subjectId ?? null,
      });

      if (!assignment.allowed) {
        return forbidden(assignment.reason);
      }

      const academicYear = await requireCurrentAcademicYear();
      const date = parseDate(parsed.date);

      if (date > new Date()) {
        return fail("Não é possível lançar chamada em data futura");
      }

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

      const saved = await prisma.$transaction(
        entries.map((entry) =>
          prisma.attendanceRecord.upsert({
            where: {
              studentId_classId_date: {
                studentId: entry.studentId,
                classId: parsed.classId,
                date,
              },
            },
            update: {
              status: entry.status,
              remarks: entry.remarks,
              subjectId: parsed.subjectId ?? null,
              teacherId: assignment.teacherId,
            },
            create: {
              studentId: entry.studentId,
              classId: parsed.classId,
              subjectId: parsed.subjectId ?? null,
              academicYearId: academicYear.id,
              teacherId: assignment.teacherId,
              date,
              status: entry.status,
              remarks: entry.remarks,
            },
          })
        )
      );

      return created(saved, {
        message:
          saved.length === 1
            ? "Frequência registrada com sucesso!"
            : `${saved.length} registros de frequência salvos com sucesso!`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao registrar frequência");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "attendance:write",
  }
);

/** GET /api/teacher/attendance — scoped to the caller's classes. */
export const GET = withAuth(
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const classId = searchParams.get("classId");
      const studentId = searchParams.get("studentId");
      const date = searchParams.get("date");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      if (classId) {
        const assignment = await checkTeachingAssignment(user, { classId });

        if (!assignment.allowed) {
          return forbidden(assignment.reason);
        }
      }

      const records = await prisma.attendanceRecord.findMany({
        where: {
          ...(classId ? { classId } : {}),
          ...(studentId ? { studentId } : {}),
          ...(date ? { date: parseDate(date) } : {}),
          ...(startDate && endDate
            ? { date: { gte: parseDate(startDate), lte: parseDate(endDate) } }
            : {}),
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
          class: {
            select: { id: true, name: true, gradeLevel: true, section: true },
          },
          subject: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ date: "desc" }, { student: { firstName: "asc" } }],
      });

      return ok(records);
    } catch (error) {
      return serverError(error, "Erro ao buscar registros");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "attendance:read",
  }
);
