import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

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
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const body = await req.json();

    // Buscar o teacher ID
    let teacherId = null;
    if (session.user.role === 'TEACHER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
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

      return NextResponse.json({
        success: true,
        message: `${createdAssessments.length} notas lançadas com sucesso!`,
        data: createdAssessments,
      }, { status: 201 });

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

      return NextResponse.json({
        success: true,
        message: 'Nota lançada com sucesso!',
        data: assessment,
      }, { status: 201 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      }, { status: 400 });
    }

    console.error('Error creating assessment:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao lançar nota',
    }, { status: 500 });
  }
}

// GET - Buscar avaliações
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autorizado',
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
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

    return NextResponse.json({
      success: true,
      data: assessments,
    });

  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar avaliações',
    }, { status: 500 });
  }
}
