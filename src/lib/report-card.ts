import { prisma } from "@/lib/prisma";
import { TERMS } from "@/lib/constants";
import { findCurrentAcademicYear } from "@/lib/academic-year";

/**
 * Report card, computed from the assessments and register entries the teachers
 * actually entered.
 *
 * `AcademicReport` existed in the schema from the start, was populated by the
 * seed, and had no screen and no API — so the school had a boletim table and no
 * boletim. This computes it instead of storing a second copy: a grade corrected
 * today changes the report immediately.
 *
 * Weighted average per subject: each assessment counts as its percentage of its
 * own maximum, times the weight of its type. A test out of 10 and one out of 100
 * are comparable, and a "Prova" can weigh more than an "Atividade".
 */

export interface SubjectTermResult {
  term: string;
  /** 0-10, or null when nothing was entered for that term. */
  average: number | null;
  assessments: {
    id: string;
    type: string;
    score: number;
    maxScore: number;
    weight: number;
    date: Date;
    remarks: string | null;
  }[];
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  teacherName: string | null;
  terms: SubjectTermResult[];
  /** Average of the terms that have results. */
  yearAverage: number | null;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Percentage counting present and late as attended. */
  rate: number;
}

export interface ReportCard {
  student: {
    id: string;
    studentId: string;
    name: string;
  };
  academicYear: number;
  placement: {
    gradeLevel: string;
    section: string;
    className: string;
  } | null;
  terms: readonly string[];
  subjects: SubjectResult[];
  attendance: AttendanceSummary;
  /** Average across subjects that have a year average. */
  overallAverage: number | null;
}

/** Weighted average of a set of assessments, on a 0-10 scale. */
function weightedAverage(
  entries: { score: number; maxScore: number; weight: number }[]
): number | null {
  const usable = entries.filter(
    (entry) => entry.maxScore > 0 && entry.weight > 0
  );

  if (usable.length === 0) return null;

  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  const weighted = usable.reduce(
    (sum, entry) => sum + (entry.score / entry.maxScore) * 10 * entry.weight,
    0
  );

  return Number((weighted / totalWeight).toFixed(2));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
  );
}

/**
 * Builds the report card for a student in a year (defaults to the current one).
 * Returns null when the student has no enrolment for that year.
 */
export async function buildReportCard(
  studentId: string,
  options: { year?: number } = {}
): Promise<ReportCard | null> {
  const academicYear = options.year
    ? await prisma.academicYear.findUnique({ where: { year: options.year } })
    : await findCurrentAcademicYear();

  if (!academicYear) return null;

  const [student, enrollment, assessments, attendance] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, studentId: true, firstName: true, lastName: true },
    }),
    prisma.enrollment.findFirst({
      where: { studentId, academicYearId: academicYear.id },
      include: { class: { select: { name: true } } },
    }),
    prisma.assessment.findMany({
      where: { studentId, academicYearId: academicYear.id },
      include: {
        subject: { select: { id: true, name: true } },
        assessmentType: { select: { name: true, weight: true } },
        teacher: {
          include: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ subject: { name: "asc" } }, { assessmentDate: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId, academicYearId: academicYear.id },
      select: { status: true },
    }),
  ]);

  if (!student) return null;

  // Group by subject, then by term.
  const bySubject = new Map<string, typeof assessments>();
  for (const assessment of assessments) {
    const list = bySubject.get(assessment.subjectId) ?? [];
    list.push(assessment);
    bySubject.set(assessment.subjectId, list);
  }

  const subjects: SubjectResult[] = [...bySubject.entries()].map(
    ([subjectId, subjectAssessments]) => {
      const terms: SubjectTermResult[] = TERMS.map((term) => {
        const termAssessments = subjectAssessments.filter(
          (assessment) => assessment.term === term
        );

        return {
          term,
          average: weightedAverage(
            termAssessments.map((assessment) => ({
              score: assessment.score,
              maxScore: assessment.maxScore,
              weight: assessment.assessmentType.weight,
            }))
          ),
          assessments: termAssessments.map((assessment) => ({
            id: assessment.id,
            type: assessment.assessmentType.name,
            score: assessment.score,
            maxScore: assessment.maxScore,
            weight: assessment.assessmentType.weight,
            date: assessment.assessmentDate,
            remarks: assessment.remarks,
          })),
        };
      });

      const teacher = subjectAssessments.find(
        (assessment) => assessment.teacher
      )?.teacher;

      return {
        subjectId,
        subjectName: subjectAssessments[0].subject.name,
        teacherName: teacher
          ? `${teacher.employee.firstName} ${teacher.employee.lastName}`
          : null,
        terms,
        yearAverage: mean(
          terms
            .map((term) => term.average)
            .filter((average): average is number => average !== null)
        ),
      };
    }
  );

  const counts = attendance.reduce(
    (totals, record) => {
      totals[record.status] += 1;
      return totals;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 }
  );

  const total = attendance.length;
  const attended = counts.PRESENT + counts.LATE;

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
    },
    academicYear: academicYear.year,
    placement: enrollment
      ? {
          gradeLevel: enrollment.gradeLevel,
          section: enrollment.section,
          className: enrollment.class.name,
        }
      : null,
    terms: TERMS,
    subjects,
    attendance: {
      total,
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      excused: counts.EXCUSED,
      rate: total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0,
    },
    overallAverage: mean(
      subjects
        .map((subject) => subject.yearAverage)
        .filter((average): average is number => average !== null)
    ),
  };
}
