import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const attendanceRecordSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
  subjectId: z.string().optional(),
  date: z.string().transform(str => new Date(str)),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  classId: z.string(),
  subjectId: z.string().optional(),
  date: z.string().transform(str => new Date(str)),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    remarks: z.string().optional(),
  })),
});

// POST - Registrar frequência (individual ou em lote)
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

    // Verificar se é registro em lote
    if (body.records && Array.isArray(body.records)) {
      const validatedData = bulkAttendanceSchema.parse(body);

      // Buscar o teacher ID
      let teacherId = null;
      if (session.user.role === 'TEACHER') {
        const employee = await prisma.employee.findUnique({
          where: { userId: session.user.id },
          include: { teacher: true },
        });
        teacherId = employee?.teacher?.id;
      }

      // Criar registros em lote
      const createdRecords = await prisma.$transaction(
        validatedData.records.map(record =>
          prisma.attendanceRecord.upsert({
            where: {
              studentId_classId_date: {
                studentId: record.studentId,
                classId: validatedData.classId,
                date: validatedData.date,
              },
            },
            update: {
              status: record.status,
              remarks: record.remarks,
              subjectId: validatedData.subjectId,
              teacherId,
            },
            create: {
              studentId: record.studentId,
              classId: validatedData.classId,
              subjectId: validatedData.subjectId,
              teacherId,
              date: validatedData.date,
              status: record.status,
              remarks: record.remarks,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        message: `${createdRecords.length} registros de frequência salvos com sucesso!`,
        data: createdRecords,
      }, { status: 201 });

    } else {
      // Registro individual
      const validatedData = attendanceRecordSchema.parse(body);

      let teacherId = null;
      if (session.user.role === 'TEACHER') {
        const employee = await prisma.employee.findUnique({
          where: { userId: session.user.id },
          include: { teacher: true },
        });
        teacherId = employee?.teacher?.id;
      }

      const record = await prisma.attendanceRecord.upsert({
        where: {
          studentId_classId_date: {
            studentId: validatedData.studentId,
            classId: validatedData.classId,
            date: validatedData.date,
          },
        },
        update: {
          status: validatedData.status,
          remarks: validatedData.remarks,
        },
        create: {
          ...validatedData,
          teacherId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Frequência registrada com sucesso!',
        data: record,
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

    console.error('Error recording attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao registrar frequência',
    }, { status: 500 });
  }
}

// GET - Buscar registros de frequência
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
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = new Date(date);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.attendanceRecord.findMany({
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
        class: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { student: { firstName: 'asc' } }],
    });

    return NextResponse.json({
      success: true,
      data: records,
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar registros',
    }, { status: 500 });
  }
}
