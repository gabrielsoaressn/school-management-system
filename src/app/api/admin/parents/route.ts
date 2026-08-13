import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";

// GET - List all parents
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search filter
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { cpf: { contains: search, mode: "insensitive" as const } },
            { phoneNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.parent.count({ where }),
    ]);

    return paginated(parents, { total: total, page: page, limit: limit });
  } catch (error: any) {
    return serverError(error, "Erro ao buscar responsáveis");
  }
}

// POST - Create new parent
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return unauthorized();
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address,
      occupation,
      cpf,
      additionalEmail,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phoneNumber || !address) {
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
      const existingCpf = await prisma.parent.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return fail("CPF já está cadastrado", 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and parent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "PARENT",
          isActive: true,
        },
      });

      // Create parent
      const parent = await tx.parent.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          phoneNumber,
          address,
          occupation: occupation || null,
          cpf: cpf || null,
          email: additionalEmail || null,
        },
      });

      return { user: newUser, parent };
    });

    return created(result, { message: "Responsável criado com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao criar responsável");
  }
}
