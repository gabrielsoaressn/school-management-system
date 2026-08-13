import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { forbidden, notFound, ok, serverError } from "@/lib/api-response";

// GET - Buscar turmas do professor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return forbidden();
    }

    let classes;

    if (session.user.role === 'ADMIN') {
      // Admin vê todas as turmas
      classes = await prisma.class.findMany({
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  studentId: true,
                  firstName: true,
                  lastName: true,
                  gradeLevel: true,
                  section: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [
          { academicYear: 'desc' },
          { gradeLevel: 'asc' },
          { section: 'asc' },
        ],
      });
    } else {
      // Professor vê apenas suas turmas (baseado em subjects)
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        include: {
          teacher: {
            include: {
              subjects: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      });

      if (!employee?.teacher) {
        return notFound('Professor não encontrado');
      }

      // Buscar turmas onde existem alunos (via enrollments)
      // TODO: Futuramente podemos adicionar uma relação direta Teacher -> Class
      classes = await prisma.class.findMany({
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  studentId: true,
                  firstName: true,
                  lastName: true,
                  gradeLevel: true,
                  section: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [
          { academicYear: 'desc' },
          { gradeLevel: 'asc' },
          { section: 'asc' },
        ],
      });
    }

    return ok(classes);

  } catch (error) {
    return serverError(error, 'Erro ao buscar turmas');
  }
}
