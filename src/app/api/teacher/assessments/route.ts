import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { created, forbidden, ok, serverError, validationFailed } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

const assessmentSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  classId: z.string(),
  assessmentTypeId: z.string(),
  term: z.string(),
  academicYear: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(0).default(10),
  remarks: z.string().optional(),
  assessmentDate: z.string().transform(str => new Date(str)).optional(),
});

const bulkAssessmentSchema = z.object({
  subjectId: z.string(),
  classId: z.string(),
  assessmentTypeId: z.string(),
  term: z.string(),
  academicYear: z.string(),
  maxScore: z.number().default(10),
  assessmentDate: z.string().transform(str => new Date(str)).optional(),
  scores: z.array(z.object({
    studentId: z.string(),
    score: z.number().min(0),
    remarks: z.string().optional(),
  })),
});

// Função para calcular nota (A, B, C, etc)
function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// POST - Criar avaliações (individual ou em lote)
export const POST = withAuth(async (request, { user }) => {
  try {

    const body = await request.json();

    // Buscar o teacher ID
    let teacherId = null;
    if (user.role === 'TEACHER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { teacher: true },
      });
      teacherId = employee?.teacher?.id;
    }

    // Verificar se é lançamento em lote
    if (body.scores && Array.isArray(body.scores)) {
      const validatedData = bulkAssessmentSchema.parse(body);

      const createdAssessments = await prisma.$transaction(
        validatedData.scores.map(scoreData => {
          const grade = calculateGrade(scoreData.score, validatedData.maxScore);

          return prisma.assessment.upsert({
            where: {
              studentId_subjectId_assessmentTypeId_term_academicYear: {
                studentId: scoreData.studentId,
                subjectId: validatedData.subjectId,
                assessmentTypeId: validatedData.assessmentTypeId,
                term: validatedData.term,
                academicYear: validatedData.academicYear,
              },
            },
            update: {
              score: scoreData.score,
              maxScore: validatedData.maxScore,
              grade,
              remarks: scoreData.remarks,
              assessmentDate: validatedData.assessmentDate || new Date(),
            },
            create: {
              studentId: scoreData.studentId,
              subjectId: validatedData.subjectId,
              classId: validatedData.classId,
              assessmentTypeId: validatedData.assessmentTypeId,
              teacherId,
              term: validatedData.term,
              academicYear: validatedData.academicYear,
              score: scoreData.score,
              maxScore: validatedData.maxScore,
              grade,
              remarks: scoreData.remarks,
              assessmentDate: validatedData.assessmentDate || new Date(),
            },
          });
        })
      );

      return created(createdAssessments, { message: `${createdAssessments.length} notas lançadas com sucesso!` });

    } else {
      // Lançamento individual
      const validatedData = assessmentSchema.parse(body);
      const grade = calculateGrade(validatedData.score, validatedData.maxScore);

      const assessment = await prisma.assessment.upsert({
        where: {
          studentId_subjectId_assessmentTypeId_term_academicYear: {
            studentId: validatedData.studentId,
            subjectId: validatedData.subjectId,
            assessmentTypeId: validatedData.assessmentTypeId,
            term: validatedData.term,
            academicYear: validatedData.academicYear,
          },
        },
        update: {
          score: validatedData.score,
          maxScore: validatedData.maxScore,
          grade,
          remarks: validatedData.remarks,
          assessmentDate: validatedData.assessmentDate || new Date(),
        },
        create: {
          ...validatedData,
          teacherId,
          grade,
          assessmentDate: validatedData.assessmentDate || new Date(),
        },
      });

      return created(assessment, { message: 'Nota lançada com sucesso!' });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao lançar nota');
  }
}, { roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"], permission: "assessment:write" });

// GET - Buscar avaliações
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const term = searchParams.get('term');
    const academicYear = searchParams.get('academicYear');

    const where: any = {};

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            section: true,
          },
        },
      },
      orderBy: [
        { academicYear: 'desc' },
        { term: 'desc' },
        { assessmentDate: 'desc' },
      ],
    });

    return ok(assessments);

  } catch (error) {
    return serverError(error, 'Erro ao buscar avaliações');
  }
}, { roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"], permission: "assessment:read" });
