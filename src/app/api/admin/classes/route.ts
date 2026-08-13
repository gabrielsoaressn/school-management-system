import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { created, fail, ok, serverError, unauthorized } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

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
}
