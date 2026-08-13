import type { AcademicYear } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentSchoolMonth, schoolDate } from "@/lib/datetime";

/**
 * The current school year.
 *
 * Every academic query is scoped to a year, so this is the entry point for
 * almost all of them. There is exactly one current year, enforced by a partial
 * unique index on `isCurrent`.
 */

export class NoCurrentAcademicYearError extends Error {
  constructor() {
    super(
      "Nenhum ano letivo está marcado como atual. Configure o ano letivo em Configurações."
    );
    this.name = "NoCurrentAcademicYearError";
  }
}

export async function findCurrentAcademicYear(): Promise<AcademicYear | null> {
  return prisma.academicYear.findFirst({ where: { isCurrent: true } });
}

/** Same, but refuses to continue without one — use in write paths. */
export async function requireCurrentAcademicYear(): Promise<AcademicYear> {
  const year = await findCurrentAcademicYear();

  if (!year) {
    throw new NoCurrentAcademicYearError();
  }

  return year;
}

export async function findAcademicYearByNumber(
  year: number
): Promise<AcademicYear | null> {
  return prisma.academicYear.findUnique({ where: { year } });
}

/**
 * Creates a year with the usual Brazilian calendar (February to December).
 * Starts as PLANNING: classes and staffing are set up before it opens.
 */
export async function createAcademicYear(
  year: number,
  options: { startDate?: Date; endDate?: Date } = {}
): Promise<AcademicYear> {
  return prisma.academicYear.create({
    data: {
      year,
      startDate: options.startDate ?? schoolDate(year, 2, 1),
      endDate: options.endDate ?? schoolDate(year, 12, 20),
      status: "PLANNING",
    },
  });
}

/**
 * Makes `year` the current one, in a transaction: the previous current year is
 * closed, so the two never disagree and the partial unique index never trips.
 */
export async function setCurrentAcademicYear(
  academicYearId: string
): Promise<AcademicYear> {
  return prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false, status: "CLOSED" },
    });

    return tx.academicYear.update({
      where: { id: academicYearId },
      data: { isCurrent: true, status: "ACTIVE" },
    });
  });
}

/**
 * The year to default to when nothing is specified: the current one, or the
 * calendar year as a last resort for a fresh install.
 */
export async function resolveAcademicYearNumber(): Promise<number> {
  const current = await findCurrentAcademicYear();
  return current?.year ?? currentSchoolMonth().year;
}
