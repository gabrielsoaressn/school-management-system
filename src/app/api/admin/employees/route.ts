import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - List all employees
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { cpf: { contains: search, mode: "insensitive" as const } },
        { employeeId: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (type && type !== "ALL") {
      where.employeeType = type;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          teacher: {
            select: {
              qualification: true,
              specialization: true,
              experience: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      data: employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar funcionários" },
      { status: 500 }
    );
  }
}

// POST - Create new employee
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      employeeType,
      position,
      department,
      salary,
      cpf,
      pixKey,
      bankName,
      bankAgency,
      bankAccount,
      // Teacher specific fields
      qualification,
      specialization,
      experience,
    } = body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !dateOfBirth ||
      !gender ||
      !phoneNumber ||
      !address ||
      !employeeType ||
      !position ||
      !salary
    ) {
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email já está em uso" },
        { status: 400 }
      );
    }

    // Check if CPF already exists
    if (cpf) {
      const existingCpf = await prisma.employee.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return NextResponse.json(
          { message: "CPF já está cadastrado" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique employee ID
    const employeeCount = await prisma.employee.count();
    const employeeId = `EMP${String(employeeCount + 1).padStart(6, "0")}`;

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "ADMIN", // You can change this based on employeeType
          isActive: true,
        },
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          employeeId,
          userId: newUser.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phoneNumber,
          address,
          employeeType,
          position,
          department: department || null,
          salary: parseFloat(salary),
          cpf: cpf || null,
          pixKey: pixKey || null,
          bankName: bankName || null,
          bankAgency: bankAgency || null,
          bankAccount: bankAccount || null,
        },
      });

      // Create teacher profile if employee is a teacher
      if (employeeType === "TEACHER") {
        if (!qualification || !specialization || experience === undefined) {
          throw new Error(
            "Campos de qualificação são obrigatórios para professores"
          );
        }

        await tx.teacher.create({
          data: {
            employeeId: employee.id,
            qualification,
            specialization,
            experience: parseInt(experience),
          },
        });
      }

      return { user: newUser, employee };
    });

    return NextResponse.json(
      { message: "Funcionário criado com sucesso", data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar funcionário" },
      { status: 500 }
    );
  }
}
