import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSettingAsNumber, getSettingAsBoolean } from "@/lib/settings";

// GET - List all students
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const gradeLevel = searchParams.get("gradeLevel") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { studentId: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (gradeLevel && gradeLevel !== "ALL") {
      where.gradeLevel = gradeLevel;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          enrollments: {
            include: {
              class: {
                select: {
                  name: true,
                  academicYear: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar alunos" },
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
    const {
      // Student data
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      gradeLevel,
      section,
      address,
      phoneNumber,
      // Parent data
      parentId, // if existing parent
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPassword,
      parentPhone,
      parentAddress,
      parentCpf,
      parentOccupation,
      // Billing options
      tuitionAmount, // optional override
      applyDiscount,
      discountType, // "PERCENTAGE" or "FIXED_AMOUNT"
      discountValue,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !dateOfBirth || !gender || !gradeLevel || !section) {
      return NextResponse.json(
        { message: "Campos obrigatórios do aluno faltando" },
        { status: 400 }
      );
    }

    // Validate parent: either parentId or parent data must be provided
    if (!parentId && (!parentFirstName || !parentLastName || !parentEmail || !parentPassword || !parentPhone)) {
      return NextResponse.json(
        { message: "Dados do responsável são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if student email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email do aluno já está em uso" },
        { status: 400 }
      );
    }

    // If creating new parent, check parent email
    if (!parentId && parentEmail) {
      const existingParentUser = await prisma.user.findUnique({
        where: { email: parentEmail },
      });

      if (existingParentUser) {
        return NextResponse.json(
          { message: "Email do responsável já está em uso" },
          { status: 400 }
        );
      }
    }

    // Find the class by gradeLevel and section
    const targetClass = await prisma.class.findFirst({
      where: {
        gradeLevel: gradeLevel,
        section: section,
      },
    });

    if (!targetClass) {
      return NextResponse.json(
        { message: `Não foi encontrada uma turma ativa para ${gradeLevel} - Seção ${section}` },
        { status: 400 }
      );
    }

    // Get system settings
    const autoGenerateBilling = await getSettingAsBoolean('auto_generate_billing', true);
    const defaultTuition = await getSettingAsNumber('default_tuition_monthly', 1500);
    const billingDueDay = await getSettingAsNumber('billing_due_day', 10);

    // Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedParentPassword = parentPassword ? await bcrypt.hash(parentPassword, 10) : null;

    // Generate unique student ID
    const studentCount = await prisma.student.count();
    const studentId = `EST${String(studentCount + 1).padStart(4, '0')}`;

    // Create user, student, parent (if needed), enrollment, and billing in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let finalParentId = parentId;
      let parent = null;

      // Create parent if not provided
      if (!parentId) {
        const parentUser = await tx.user.create({
          data: {
            email: parentEmail!,
            password: hashedParentPassword!,
            role: "PARENT",
            isActive: true,
          },
        });

        parent = await tx.parent.create({
          data: {
            userId: parentUser.id,
            firstName: parentFirstName!,
            lastName: parentLastName!,
            phoneNumber: parentPhone!,
            address: parentAddress || "",
            cpf: parentCpf || null,
            email: parentEmail,
            occupation: parentOccupation || null,
          },
        });

        finalParentId = parent.id;
      }

      // Create student user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      });

      // Create student
      const student = await tx.student.create({
        data: {
          studentId,
          userId: newUser.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          gradeLevel,
          section,
          address: address || "",
          phoneNumber: phoneNumber || null,
          parentId: finalParentId,
        },
      });

      // Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: targetClass.id,
        },
      });

      let billing = null;

      // Generate billing automatically if enabled
      if (autoGenerateBilling && finalParentId) {
        // Calculate billing amount
        let billingAmount = tuitionAmount || defaultTuition;

        // Apply discount if requested
        if (applyDiscount && discountValue) {
          if (discountType === "PERCENTAGE") {
            billingAmount = billingAmount * (1 - discountValue / 100);
          } else {
            billingAmount = billingAmount - discountValue;
          }
        }

        // Generate invoice number
        const billingCount = await tx.billing.count();
        const invoiceNumber = `INV${String(billingCount + 1).padStart(6, '0')}`;

        // Calculate due date
        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), billingDueDay);

        // If due day has passed this month, set for next month
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        billing = await tx.billing.create({
          data: {
            invoiceNumber,
            parentId: finalParentId,
            type: "TUITION",
            description: `Mensalidade ${gradeLevel} - ${firstName} ${lastName}`,
            amount: billingAmount,
            dueDate,
            status: "DRAFT",
            isRecurring: true,
            recurrence: "MONTHLY",
            notes: applyDiscount
              ? `Desconto aplicado: ${discountType === "PERCENTAGE" ? `${discountValue}%` : `R$ ${discountValue}`} | Aguardando aprovação do administrador`
              : `Aguardando aprovação do administrador`,
          },
        });
      }

      return { user: newUser, student, parent, enrollment, billing };
    });

    const responseMessage = result.parent
      ? "Aluno e responsável criados com sucesso!"
      : "Aluno criado com sucesso!";

    const billingMessage = result.billing
      ? " Mensalidade gerada automaticamente."
      : "";

    return NextResponse.json(
      {
        message: responseMessage + billingMessage,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar aluno" },
      { status: 500 }
    );
  }
}
