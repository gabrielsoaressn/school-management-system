import { prisma } from "@/lib/prisma";
import { created, fail, ok, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import {
  findAcademicYearByNumber,
  findCurrentAcademicYear,
} from "@/lib/academic-year";

export const GET = withAuth(
  async (_request) => {
    try {
      // Scoped to the current year: a listing of every class ever run is not what
      // any screen wants.
      const currentYear = await findCurrentAcademicYear();

      const classes = await prisma.class.findMany({
        where: currentYear ? { academicYearId: currentYear.id } : undefined,
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
      });

      return ok(classes);
    } catch (error: any) {
      return serverError(error, "Erro ao buscar turmas");
    }
  },
  { permission: "class:read" }
);

export const POST = withAuth(
  async (request) => {
    try {
      const body = await request.json();
      const {
        name,
        gradeLevel,
        section,
        academicYear,
        capacity,
        schedule,
        roomNumber,
      } = body;

      // Validate required fields
      if (!name || !gradeLevel || !section || !academicYear) {
        return fail("Campos obrigatórios faltando", 400);
      }

      // The year is a row now, not a string on the class. This route still wrote
      // `academicYear: "2026"` after phase 4 and TypeScript could not catch it,
      // because the request body is `any` — so creating a class from the form had
      // been failing at runtime.
      const year = Number(academicYear);

      if (!Number.isInteger(year)) {
        return fail("Ano letivo inválido", 400);
      }

      const schoolYear = await findAcademicYearByNumber(year);

      if (!schoolYear) {
        return fail(
          `O ano letivo ${year} não está cadastrado. Crie o ano letivo antes da turma.`,
          400
        );
      }

      const existingClass = await prisma.class.findUnique({
        where: {
          gradeLevel_section_academicYearId: {
            gradeLevel,
            section,
            academicYearId: schoolYear.id,
          },
        },
      });

      if (existingClass) {
        return fail(
          `Já existe uma turma de ${gradeLevel} - ${section} em ${year}`,
          400
        );
      }

      const newClass = await prisma.class.create({
        data: {
          name,
          gradeLevel,
          section,
          academicYearId: schoolYear.id,
          capacity: capacity ? parseInt(capacity) : null,
          schedule: schedule || null,
          roomNumber: roomNumber || null,
        },
      });

      return created(newClass, { message: "Turma criada com sucesso" });
    } catch (error: any) {
      return serverError(error, "Erro ao criar turma");
    }
  },
  { permission: "class:write" }
);
