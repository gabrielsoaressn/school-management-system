import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { created, forbidden, ok, serverError, validationFailed } from "@/lib/api-response";

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
      return forbidden();
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

      return created(createdRecords, { message: `${createdRecords.length} registros de frequência salvos com sucesso!` });

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

      return created(record, { message: 'Frequência registrada com sucesso!' });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, 'Erro ao registrar frequência');
  }
}

// GET - Buscar registros de frequência
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return forbidden();
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

    return ok(records);

  } catch (error) {
    return serverError(error, 'Erro ao buscar registros');
  }
}
