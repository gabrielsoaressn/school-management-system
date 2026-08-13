import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/lib/api-auth";

/**
 * What a teacher is allowed to touch.
 *
 * Until now the API checked the *role* and not the *assignment*: any teacher
 * could post grades for any class and any subject in the school. The authority
 * is ClassSubjectTeacher — the curriculum — and it is checked on the server, so
 * a hand-made request is refused the same way the UI is.
 */

export class NotAssignedError extends Error {
  constructor(message = "Você não leciona esta disciplina nesta turma") {
    super(message);
    this.name = "NotAssignedError";
  }
}

/** The Teacher row behind a user account, or null if there is none. */
export async function findTeacherForUser(userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { teacher: { select: { id: true } } },
  });

  return employee?.teacher ?? null;
}

/**
 * Roles that see every class. Coordination and secretarial staff supervise the
 * whole school; a teacher sees only where they teach.
 */
function supervisesEverything(user: AuthenticatedUser): boolean {
  return user.role === "ADMIN" || user.role === "COORDINATOR" || user.role === "SECRETARY";
}

/**
 * Classes the user may work with, in the current year.
 * Supervisors get all of them; a teacher gets the ones they are assigned to.
 */
export async function findTeachableClasses(user: AuthenticatedUser) {
  const baseInclude = {
    academicYear: { select: { year: true } },
    enrollments: {
      where: { status: "ACTIVE" as const },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    assignments: {
      include: { subject: { select: { id: true, name: true, code: true } } },
    },
    _count: { select: { enrollments: true } },
  };

  const orderBy = [
    { gradeLevel: "asc" as const },
    { section: "asc" as const },
  ];

  if (supervisesEverything(user)) {
    return prisma.class.findMany({
      where: { academicYear: { isCurrent: true } },
      include: baseInclude,
      orderBy,
    });
  }

  const teacher = await findTeacherForUser(user.id);

  if (!teacher) return [];

  return prisma.class.findMany({
    where: {
      academicYear: { isCurrent: true },
      assignments: { some: { teacherId: teacher.id } },
    },
    include: baseInclude,
    orderBy,
  });
}

/** Subjects the user may work with in a class. */
export async function findTeachableSubjects(
  user: AuthenticatedUser,
  classId: string
) {
  if (supervisesEverything(user)) {
    const assignments = await prisma.classSubjectTeacher.findMany({
      where: { classId },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    });

    return assignments.map((assignment) => assignment.subject);
  }

  const teacher = await findTeacherForUser(user.id);

  if (!teacher) return [];

  const assignments = await prisma.classSubjectTeacher.findMany({
    where: { classId, teacherId: teacher.id },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });

  return assignments.map((assignment) => assignment.subject);
}

export interface AssignmentCheck {
  allowed: boolean;
  /** The teacher whose id should be recorded on the entry, when there is one. */
  teacherId: string | null;
  reason?: string;
}

/**
 * May this user write grades or attendance for this class (and subject)?
 *
 * Supervisors may, and their entries are recorded without a teacherId unless
 * they happen to be a teacher too. A teacher may only where they are assigned.
 */
export async function checkTeachingAssignment(
  user: AuthenticatedUser,
  { classId, subjectId }: { classId: string; subjectId?: string | null }
): Promise<AssignmentCheck> {
  const teacher = await findTeacherForUser(user.id);

  if (supervisesEverything(user)) {
    return { allowed: true, teacherId: teacher?.id ?? null };
  }

  if (!can(user, "assessment:write") && !can(user, "attendance:write")) {
    return { allowed: false, teacherId: null, reason: "Sem permissão" };
  }

  if (!teacher) {
    return {
      allowed: false,
      teacherId: null,
      reason: "Sua conta não está vinculada a um cadastro de professor",
    };
  }

  const assignment = await prisma.classSubjectTeacher.findFirst({
    where: {
      classId,
      teacherId: teacher.id,
      ...(subjectId ? { subjectId } : {}),
    },
    select: { id: true },
  });

  if (!assignment) {
    return {
      allowed: false,
      teacherId: teacher.id,
      reason: subjectId
        ? "Você não leciona esta disciplina nesta turma"
        : "Você não leciona nesta turma",
    };
  }

  return { allowed: true, teacherId: teacher.id };
}
