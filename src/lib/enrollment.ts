import type { Enrollment, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The only place that writes an enrolment.
 *
 * `Enrollment.gradeLevel` and `.section` are copies of the class's, kept so that
 * "which grade was this student in, that year?" is a single-table question for
 * report cards, transcripts and the promotion routine. Funnelling every write
 * through here is what keeps the copy honest.
 */

type DbClient =
  | typeof prisma
  | Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class ClassNotFoundError extends Error {
  constructor(gradeLevel: string, section: string, year: number) {
    super(
      `Não existe turma de ${gradeLevel} - ${section} no ano letivo ${year}. Crie a turma antes de matricular.`
    );
    this.name = "ClassNotFoundError";
  }
}

export class AlreadyEnrolledError extends Error {
  constructor(year: number) {
    super(`Este aluno já possui matrícula no ano letivo ${year}.`);
    this.name = "AlreadyEnrolledError";
  }
}

/** Enrols a student in a class, copying the placement from the class. */
export async function enrollStudent(
  {
    studentId,
    classId,
  }: {
    studentId: string;
    classId: string;
  },
  client: DbClient = prisma
): Promise<Enrollment> {
  const schoolClass = await client.class.findUnique({
    where: { id: classId },
    include: { academicYear: true },
  });

  if (!schoolClass) {
    throw new Error("Turma não encontrada");
  }

  const existing = await client.enrollment.findUnique({
    where: {
      studentId_academicYearId: {
        studentId,
        academicYearId: schoolClass.academicYearId,
      },
    },
  });

  if (existing) {
    throw new AlreadyEnrolledError(schoolClass.academicYear.year);
  }

  return client.enrollment.create({
    data: {
      studentId,
      classId,
      academicYearId: schoolClass.academicYearId,
      gradeLevel: schoolClass.gradeLevel,
      section: schoolClass.section,
      status: "ACTIVE",
    },
  });
}

/** Finds the class for a placement in a given year. */
export async function findClassForPlacement(
  {
    gradeLevel,
    section,
    academicYearId,
  }: {
    gradeLevel: string;
    section: string;
    academicYearId: string;
  },
  client: DbClient = prisma
) {
  return client.class.findUnique({
    where: {
      gradeLevel_section_academicYearId: { gradeLevel, section, academicYearId },
    },
  });
}

/** Moves a student to another class in the same year, keeping the copy in step. */
export async function transferStudent(
  { enrollmentId, classId }: { enrollmentId: string; classId: string },
  client: DbClient = prisma
): Promise<Enrollment> {
  const [enrollment, target] = await Promise.all([
    client.enrollment.findUnique({ where: { id: enrollmentId } }),
    client.class.findUnique({ where: { id: classId } }),
  ]);

  if (!enrollment) throw new Error("Matrícula não encontrada");
  if (!target) throw new Error("Turma de destino não encontrada");

  if (target.academicYearId !== enrollment.academicYearId) {
    throw new Error(
      "A turma de destino pertence a outro ano letivo. Use a rematrícula."
    );
  }

  return client.enrollment.update({
    where: { id: enrollmentId },
    data: {
      classId: target.id,
      gradeLevel: target.gradeLevel,
      section: target.section,
    },
  });
}

/** The student's placement in the current year, if any. */
export async function findActiveEnrollment(studentId: string) {
  return prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      academicYear: { isCurrent: true },
    },
    include: { class: true, academicYear: true },
  });
}

/**
 * Placement of many students at once, for listings. Avoids the N+1 that a
 * per-row lookup of "which grade is this student in?" would create.
 */
export async function findActiveEnrollments(
  studentIds: string[]
): Promise<Map<string, { gradeLevel: string; section: string; classId: string }>> {
  if (studentIds.length === 0) return new Map();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: { in: studentIds },
      status: "ACTIVE",
      academicYear: { isCurrent: true },
    },
    select: {
      studentId: true,
      gradeLevel: true,
      section: true,
      classId: true,
    },
  });

  return new Map(
    enrollments.map((enrollment) => [
      enrollment.studentId,
      {
        gradeLevel: enrollment.gradeLevel,
        section: enrollment.section,
        classId: enrollment.classId,
      },
    ])
  );
}

/** Filter for "students enrolled in the current year", optionally by grade. */
export function currentEnrollmentFilter(gradeLevel?: string): Prisma.StudentWhereInput {
  return {
    enrollments: {
      some: {
        status: "ACTIVE",
        academicYear: { isCurrent: true },
        ...(gradeLevel ? { gradeLevel } : {}),
      },
    },
  };
}
