import { Prisma, type Enrollment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAcademicYear, findAcademicYearByNumber } from "@/lib/academic-year";
import { GRADE_LEVELS } from "@/lib/constants";
import { buildTuitionCharge, tuitionChargeNote } from "@/lib/tuition";
import { nextInvoiceNumber } from "@/lib/identifiers";
import { getSettingAsBoolean, getSettingAsNumber } from "@/lib/settings";

/**
 * Promotion and re-enrolment: moving a whole school from one year to the next.
 *
 * The most important annual flow in a school, and it did not exist — there was
 * no way to express "this student was in 3º Ano last year and is in 4º Ano now",
 * because the grade level lived on Student and simply got overwritten.
 *
 * Deliberately a two-step process:
 *   1. `previewReEnrollment` shows what would happen, per student, and lets the
 *      school mark who is retained.
 *   2. `runReEnrollment` writes it: closes last year's enrolments, creates this
 *      year's, and issues the new cycle's tuition charges.
 */

/** Next grade after `gradeLevel`, or null if it is the last one. */
export function nextGradeLevel(gradeLevel: string): string | null {
  const index = GRADE_LEVELS.indexOf(gradeLevel as (typeof GRADE_LEVELS)[number]);

  if (index === -1) return null;
  if (index === GRADE_LEVELS.length - 1) return null;

  return GRADE_LEVELS[index + 1];
}

export type ReEnrollmentOutcome =
  | "PROMOTED"
  | "RETAINED"
  | "GRADUATING"
  | "NO_CLASS"
  | "ALREADY_ENROLLED";

export interface StudentPlan {
  studentId: string;
  studentCode: string;
  name: string;
  currentGradeLevel: string;
  currentSection: string;
  targetGradeLevel: string | null;
  targetSection: string | null;
  targetClassId: string | null;
  outcome: ReEnrollmentOutcome;
  note?: string;
}

export interface ReEnrollmentPreview {
  fromYear: number;
  toYear: number;
  toYearExists: boolean;
  students: StudentPlan[];
  summary: Record<ReEnrollmentOutcome, number>;
}

/**
 * What would happen if we promoted everyone from `fromYear` into `toYear`.
 *
 * `retainedStudentIds` are the ones the school decided to hold back: they repeat
 * the same grade instead of advancing. Nothing is written.
 */
export async function previewReEnrollment({
  fromYear,
  toYear,
  retainedStudentIds = [],
}: {
  fromYear: number;
  toYear: number;
  retainedStudentIds?: string[];
}): Promise<ReEnrollmentPreview> {
  const retained = new Set(retainedStudentIds);

  const source = await findAcademicYearByNumber(fromYear);

  if (!source) {
    throw new Error(`Ano letivo ${fromYear} não encontrado`);
  }

  const target = await findAcademicYearByNumber(toYear);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      academicYearId: source.id,
      status: { in: ["ACTIVE", "COMPLETED", "RETAINED"] },
    },
    include: {
      student: {
        select: { id: true, studentId: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
  });

  // Classes of the target year, so we can tell whether a placement exists.
  const targetClasses = target
    ? await prisma.class.findMany({ where: { academicYearId: target.id } })
    : [];

  const classByPlacement = new Map(
    targetClasses.map((klass) => [
      `${klass.gradeLevel}|${klass.section}`,
      klass.id,
    ])
  );

  const existing = target
    ? new Set(
        (
          await prisma.enrollment.findMany({
            where: { academicYearId: target.id },
            select: { studentId: true },
          })
        ).map((row) => row.studentId)
      )
    : new Set<string>();

  const students: StudentPlan[] = enrollments.map((enrollment) => {
    const base = {
      studentId: enrollment.studentId,
      studentCode: enrollment.student.studentId,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      currentGradeLevel: enrollment.gradeLevel,
      currentSection: enrollment.section,
    };

    if (existing.has(enrollment.studentId)) {
      return {
        ...base,
        targetGradeLevel: null,
        targetSection: null,
        targetClassId: null,
        outcome: "ALREADY_ENROLLED" as const,
        note: `Já possui matrícula em ${toYear}`,
      };
    }

    const isRetained = retained.has(enrollment.studentId);
    const targetGrade = isRetained
      ? enrollment.gradeLevel
      : nextGradeLevel(enrollment.gradeLevel);

    if (!targetGrade) {
      return {
        ...base,
        targetGradeLevel: null,
        targetSection: null,
        targetClassId: null,
        outcome: "GRADUATING" as const,
        note: "Concluiu a última série oferecida",
      };
    }

    // Keeps the same section when the target year has it.
    const classId =
      classByPlacement.get(`${targetGrade}|${enrollment.section}`) ??
      classByPlacement.get(`${targetGrade}|A`) ??
      null;

    if (!classId) {
      return {
        ...base,
        targetGradeLevel: targetGrade,
        targetSection: enrollment.section,
        targetClassId: null,
        outcome: "NO_CLASS" as const,
        note: `Não há turma de ${targetGrade} em ${toYear}`,
      };
    }

    const klass = targetClasses.find((candidate) => candidate.id === classId)!;

    return {
      ...base,
      targetGradeLevel: klass.gradeLevel,
      targetSection: klass.section,
      targetClassId: klass.id,
      outcome: isRetained ? ("RETAINED" as const) : ("PROMOTED" as const),
    };
  });

  const summary = students.reduce(
    (totals, plan) => {
      totals[plan.outcome] += 1;
      return totals;
    },
    {
      PROMOTED: 0,
      RETAINED: 0,
      GRADUATING: 0,
      NO_CLASS: 0,
      ALREADY_ENROLLED: 0,
    } as Record<ReEnrollmentOutcome, number>
  );

  return {
    fromYear,
    toYear,
    toYearExists: Boolean(target),
    students,
    summary,
  };
}

/**
 * Copies a year's classes (and their curriculum) into another year.
 *
 * A school does not invent next year's classes from scratch: it runs the same
 * grades and sections, with the same staffing, and adjusts. Without this the
 * promotion has nowhere to put anyone.
 *
 * Idempotent: a class that already exists for that grade/section is left alone.
 */
export async function cloneClassesForYear({
  fromYear,
  toYear,
  copyTeachers = true,
}: {
  fromYear: number;
  toYear: number;
  copyTeachers?: boolean;
}): Promise<{ classesCreated: number; assignmentsCreated: number }> {
  const [source, target] = await Promise.all([
    findAcademicYearByNumber(fromYear),
    findAcademicYearByNumber(toYear),
  ]);

  if (!source) throw new Error(`Ano letivo ${fromYear} não encontrado`);
  if (!target) throw new Error(`Ano letivo ${toYear} não encontrado`);

  const sourceClasses = await prisma.class.findMany({
    where: { academicYearId: source.id },
    include: { assignments: true },
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
  });

  const existing = new Set(
    (
      await prisma.class.findMany({
        where: { academicYearId: target.id },
        select: { gradeLevel: true, section: true },
      })
    ).map((klass) => `${klass.gradeLevel}|${klass.section}`)
  );

  let classesCreated = 0;
  let assignmentsCreated = 0;

  for (const sourceClass of sourceClasses) {
    if (existing.has(`${sourceClass.gradeLevel}|${sourceClass.section}`)) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          name: `${sourceClass.gradeLevel} - Turma ${sourceClass.section}`,
          gradeLevel: sourceClass.gradeLevel,
          section: sourceClass.section,
          academicYearId: target.id,
          roomNumber: sourceClass.roomNumber,
          schedule: sourceClass.schedule,
          capacity: sourceClass.capacity,
        },
      });

      if (sourceClass.assignments.length > 0) {
        await tx.classSubjectTeacher.createMany({
          data: sourceClass.assignments.map((assignment) => ({
            classId: created.id,
            subjectId: assignment.subjectId,
            // Staffing is a decision for the new year; copying it is a starting
            // point the coordination screen can change.
            teacherId: copyTeachers ? assignment.teacherId : null,
            academicYearId: target.id,
            weeklyPeriods: assignment.weeklyPeriods,
          })),
        });
        assignmentsCreated += sourceClass.assignments.length;
      }
    });

    classesCreated += 1;
  }

  return { classesCreated, assignmentsCreated };
}

export interface ReEnrollmentResult {
  toYear: number;
  createdYear: boolean;
  classesCreated: number;
  enrolled: number;
  retained: number;
  graduating: number;
  skipped: number;
  chargesCreated: number;
}

/**
 * Writes the promotion.
 *
 * Per student, in one transaction: last year's enrolment is closed (COMPLETED or
 * RETAINED, so the history says which), this year's is created, and the tuition
 * charge for the new cycle is issued if the school bills automatically.
 *
 * Idempotent per student: anyone already enrolled in the target year is skipped,
 * so a partial run can simply be repeated.
 */
export async function runReEnrollment({
  fromYear,
  toYear,
  retainedStudentIds = [],
  createTargetYear = true,
  cloneClasses = true,
  issueCharges = true,
}: {
  fromYear: number;
  toYear: number;
  retainedStudentIds?: string[];
  createTargetYear?: boolean;
  cloneClasses?: boolean;
  issueCharges?: boolean;
}): Promise<ReEnrollmentResult> {
  let target = await findAcademicYearByNumber(toYear);
  let createdYear = false;

  if (!target) {
    if (!createTargetYear) {
      throw new Error(`Ano letivo ${toYear} não existe`);
    }
    target = await createAcademicYear(toYear);
    createdYear = true;
  }

  // Classes first: the promotion needs somewhere to place people.
  const cloned = cloneClasses
    ? await cloneClassesForYear({ fromYear, toYear })
    : { classesCreated: 0, assignmentsCreated: 0 };

  const preview = await previewReEnrollment({
    fromYear,
    toYear,
    retainedStudentIds,
  });

  const [autoCharge, defaultTuition, dueDay] = await Promise.all([
    getSettingAsBoolean("auto_generate_billing", true),
    getSettingAsNumber("default_tuition_monthly", 1500),
    getSettingAsNumber("billing_due_day", 10),
  ]);

  const shouldCharge = issueCharges && autoCharge;

  const result: ReEnrollmentResult = {
    toYear,
    createdYear,
    classesCreated: cloned.classesCreated,
    enrolled: 0,
    retained: 0,
    graduating: preview.summary.GRADUATING,
    skipped: preview.summary.ALREADY_ENROLLED + preview.summary.NO_CLASS,
    chargesCreated: 0,
  };

  for (const plan of preview.students) {
    if (plan.outcome !== "PROMOTED" && plan.outcome !== "RETAINED") {
      continue;
    }

    const invoiceNumber = shouldCharge ? await nextInvoiceNumber() : null;

    await prisma.$transaction(async (tx) => {
      // Close last year's placement, recording the outcome.
      await tx.enrollment.updateMany({
        where: {
          studentId: plan.studentId,
          academicYear: { year: fromYear },
          status: "ACTIVE",
        },
        data: {
          status: plan.outcome === "RETAINED" ? "RETAINED" : "COMPLETED",
          endedAt: new Date(),
        },
      });

      await tx.enrollment.create({
        data: {
          studentId: plan.studentId,
          classId: plan.targetClassId!,
          academicYearId: target!.id,
          gradeLevel: plan.targetGradeLevel!,
          section: plan.targetSection!,
          status: "ACTIVE",
        },
      });

      if (!shouldCharge || !invoiceNumber) return;

      // The charge goes to whoever pays for this student.
      const payer = await resolvePayer(plan.studentId, tx);

      if (!payer) return;

      const charge = buildTuitionCharge({
        baseAmount: defaultTuition,
        dueDay,
        referenceDate: target!.startDate,
      });

      await tx.billing.create({
        data: {
          invoiceNumber,
          parentId: payer,
          type: "TUITION",
          description: `Mensalidade ${plan.targetGradeLevel} - ${plan.name} (${toYear})`,
          amount: charge.amount,
          dueDate: charge.dueDate,
          status: "DRAFT",
          isRecurring: true,
          recurrence: "MONTHLY",
          nextBillingDate: charge.nextBillingDate,
          notes: tuitionChargeNote(charge),
        },
      });

      result.chargesCreated += 1;
    });

    if (plan.outcome === "RETAINED") {
      result.retained += 1;
    } else {
      result.enrolled += 1;
    }
  }

  return result;
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Financial guardian, falling back to the direct parent link. */
async function resolvePayer(
  studentId: string,
  tx: TxClient
): Promise<string | null> {
  const financial = await tx.guardianRelationship.findFirst({
    where: { studentId, guardianType: { in: ["FINANCIAL", "BOTH"] } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { parentId: true },
  });

  if (financial) return financial.parentId;

  const student = await tx.student.findUnique({
    where: { id: studentId },
    select: { parentId: true },
  });

  return student?.parentId ?? null;
}
