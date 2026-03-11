import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(classes);
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar turmas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, gradeLevel, section, academicYear, capacity, schedule, roomNumber } =
      body;

    // Validate required fields
    if (!name || !gradeLevel || !section || !academicYear) {
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          message: "Já existe uma turma com este ano/série e seção para este ano letivo",
        },
        { status: 400 }
      );
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

    return NextResponse.json(
      { message: "Turma criada com sucesso", data: newClass },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar turma" },
      { status: 500 }
    );
  }
}
