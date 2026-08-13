/**
 * Data migration: Grade -> Assessment and Attendance -> AttendanceRecord.
 *
 * The legacy pair recorded a grade against (student, subject, term) and a
 * register entry against (student, date), with no class, no teacher and no
 * academic year. The current models carry all three, so this fills them in from
 * the student's enrolment for the year in question.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     prisma/migrations-data/2026-08-13-grades-to-assessments.ts [--dry-run]
 *
 * Idempotent: writes go through upserts on the natural keys, so re-running
 * converges instead of duplicating.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

/** Assessment type used for migrated grades, so they are distinguishable. */
const LEGACY_TYPE_CODE = "LEGACY";

async function ensureLegacyAssessmentType() {
  const existing = await prisma.assessmentType.findUnique({
    where: { code: LEGACY_TYPE_CODE },
  });

  if (existing) return existing;

  if (dryRun) {
    return {
      id: "(a criar)",
      name: "Nota migrada",
      code: LEGACY_TYPE_CODE,
      maxScore: 100,
    } as Awaited<ReturnType<typeof prisma.assessmentType.create>>;
  }

  return prisma.assessmentType.create({
    data: {
      name: "Nota migrada (modelo antigo)",
      code: LEGACY_TYPE_CODE,
      weight: 1,
      maxScore: 100,
      description:
        "Notas importadas do modelo Grade, que não distinguia tipo de avaliação.",
    },
  });
}

/**
 * The enrolment that was in force for a student in a given year, so the class
 * and the year of a legacy record can be recovered.
 */
async function enrollmentFor(studentId: string, year: number) {
  return prisma.enrollment.findFirst({
    where: { studentId, academicYear: { year } },
    include: { academicYear: true },
  });
}

async function migrateGrades(legacyTypeId: string) {
  const grades = await prisma.grade.findMany({
    orderBy: { createdAt: "asc" },
  });

  let migrated = 0;
  const skipped: string[] = [];

  for (const grade of grades) {
    const year = Number(grade.academicYear);
    const enrollment = await enrollmentFor(grade.studentId, year);

    if (!enrollment) {
      // No enrolment for that year: there is no class to attach the grade to.
      skipped.push(`${grade.studentId}/${grade.academicYear}`);
      continue;
    }

    if (dryRun) {
      migrated += 1;
      continue;
    }

    await prisma.assessment.upsert({
      where: {
        studentId_subjectId_assessmentTypeId_term_academicYearId: {
          studentId: grade.studentId,
          subjectId: grade.subjectId,
          assessmentTypeId: legacyTypeId,
          term: grade.term,
          academicYearId: enrollment.academicYearId,
        },
      },
      update: {
        score: grade.score,
        maxScore: grade.maxScore,
        grade: grade.grade,
        remarks: grade.remarks,
      },
      create: {
        studentId: grade.studentId,
        subjectId: grade.subjectId,
        classId: enrollment.classId,
        teacherId: grade.teacherId,
        assessmentTypeId: legacyTypeId,
        academicYearId: enrollment.academicYearId,
        term: grade.term,
        score: grade.score,
        maxScore: grade.maxScore,
        grade: grade.grade,
        remarks: grade.remarks,
        assessmentDate: grade.createdAt,
      },
    });

    migrated += 1;
  }

  return { total: grades.length, migrated, skipped };
}

async function migrateAttendance() {
  const records = await prisma.attendance.findMany({
    orderBy: { date: "asc" },
  });

  let migrated = 0;
  const skipped: string[] = [];

  for (const record of records) {
    // The legacy row has no year: take it from the date.
    const year = record.date.getFullYear();
    const enrollment = await enrollmentFor(record.studentId, year);

    if (!enrollment) {
      skipped.push(`${record.studentId}/${year}`);
      continue;
    }

    if (dryRun) {
      migrated += 1;
      continue;
    }

    await prisma.attendanceRecord.upsert({
      where: {
        studentId_classId_date: {
          studentId: record.studentId,
          classId: enrollment.classId,
          date: record.date,
        },
      },
      update: {
        status: record.status,
        remarks: record.remarks,
      },
      create: {
        studentId: record.studentId,
        classId: enrollment.classId,
        academicYearId: enrollment.academicYearId,
        date: record.date,
        status: record.status,
        remarks: record.remarks,
      },
    });

    migrated += 1;
  }

  return { total: records.length, migrated, skipped };
}

async function main() {
  console.log(
    `\nGrade -> Assessment, Attendance -> AttendanceRecord${
      dryRun ? " (dry run: nothing will be written)" : ""
    }\n`
  );

  const legacyType = await ensureLegacyAssessmentType();

  const grades = await migrateGrades(legacyType.id);
  console.log(`  notas:     ${grades.migrated}/${grades.total} migradas`);
  if (grades.skipped.length > 0) {
    console.log(
      `             ${grades.skipped.length} sem matrícula no ano correspondente (não migradas)`
    );
  }

  const attendance = await migrateAttendance();
  console.log(
    `  presenças: ${attendance.migrated}/${attendance.total} migradas`
  );
  if (attendance.skipped.length > 0) {
    console.log(
      `             ${attendance.skipped.length} sem matrícula no ano correspondente (não migradas)`
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("\nFalha na migração:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
