import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { userRoleForEmployeeType } from "@/lib/employee-types";
import { redactEmployeeList } from "@/lib/redact";

// GET - List all employees
export const GET = withAuth(async (request, { user }) => {
  try {

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

    return paginated(redactEmployeeList(employees, user), {
      total: total,
      page: page,
      limit: limit,
    });
  } catch (error: any) {
    return serverError(error, "Erro ao buscar funcionários");
  }
}, { permission: "employee:read" });

// POST - Create new employee
export const POST = withAuth(async (request, { user }) => {
  try {

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
      return fail("Campos obrigatórios faltando", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return fail("Email já está em uso", 400);
    }

    // Check if CPF already exists
    if (cpf) {
      const existingCpf = await prisma.employee.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return fail("CPF já está cadastrado", 400);
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
          role: userRoleForEmployeeType(employeeType),
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

    return created(result, { message: "Funcionário criado com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao criar funcionário");
  }
}, { permission: "employee:write" });
