import { prisma } from "@/lib/prisma";
import { created, fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(async (request, { user }) => {
  try {

    const classes = await prisma.class.findMany({
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
}, { permission: "class:read" });

export const POST = withAuth(async (request, { user }) => {
  try {

    const body = await request.json();
    const { name, gradeLevel, section, academicYear, capacity, schedule, roomNumber } =
      body;

    // Validate required fields
    if (!name || !gradeLevel || !section || !academicYear) {
      return fail("Campos obrigatórios faltando", 400);
    }

    // Check if class with same gradeLevel+section already exists for this academic year
    const existingClass = await prisma.class.findFirst({
      where: {
        gradeLevel,
        section,
        academicYear: academicYear.toString(),
      },
    });

    if (existingClass) {
      return fail("Já existe uma turma com este ano/série e seção para este ano letivo", 400);
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name,
        gradeLevel,
        section,
        academicYear: academicYear.toString(),
        capacity: capacity ? parseInt(capacity) : null,
        schedule: schedule || null,
        roomNumber: roomNumber || null,
      },
    });

    return created(newClass, { message: "Turma criada com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao criar turma");
  }
}, { permission: "class:write" });
