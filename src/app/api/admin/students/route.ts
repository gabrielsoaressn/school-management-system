import { prisma } from "@/lib/prisma";
import { getSettingAsNumber, getSettingAsBoolean } from "@/lib/settings";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { nextInvoiceNumber, nextStudentId } from "@/lib/identifiers";
import { buildTuitionCharge, tuitionChargeNote } from "@/lib/tuition";
import type { DiscountType } from "@prisma/client";

// GET - List all students
export const GET = withAuth(async (request, { user }) => {
  try {

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

    return paginated(students, { total: total, page: page, limit: limit });
  } catch (error: any) {
    return serverError(error, "Erro ao buscar alunos");
  }
}, { permission: "student:read" });

export const POST = withAuth(async (request, { user }) => {
  try {

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
      return fail("Campos obrigatórios do aluno faltando", 400);
    }

    // Validate parent: either parentId or parent data must be provided
    if (!parentId && (!parentFirstName || !parentLastName || !parentEmail || !parentPassword || !parentPhone)) {
      return fail("Dados do responsável são obrigatórios", 400);
    }

    // Check if student email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return fail("Email do aluno já está em uso", 400);
    }

    // If creating new parent, check parent email
    if (!parentId && parentEmail) {
      const existingParentUser = await prisma.user.findUnique({
        where: { email: parentEmail },
      });

      if (existingParentUser) {
        return fail("Email do responsável já está em uso", 400);
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
      return fail(`Não foi encontrada uma turma ativa para ${gradeLevel} - Seção ${section}`, 400);
    }

    // Get system settings
    const autoGenerateBilling = await getSettingAsBoolean('auto_generate_billing', true);
    const defaultTuition = await getSettingAsNumber('default_tuition_monthly', 1500);
    const billingDueDay = await getSettingAsNumber('billing_due_day', 10);

    // Hash passwords
    // Passwords typed by the staff still have to clear the policy, and the
    // account owner must replace them on first login.
    const studentCheck = validatePassword(password, { email });
    if (!studentCheck.valid) {
      return fail(studentCheck.errors[0], 400, { errors: studentCheck.errors });
    }

    if (parentPassword) {
      const parentCheck = validatePassword(parentPassword, { email: parentEmail });
      if (!parentCheck.valid) {
        return fail(parentCheck.errors[0], 400, { errors: parentCheck.errors });
      }
    }

    const hashedPassword = await hashPassword(password);
    const hashedParentPassword = parentPassword ? await hashPassword(parentPassword) : null;

    // Generate unique student ID
    const studentId = await nextStudentId();

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
            mustChangePassword: true,
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
          mustChangePassword: true,
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

        const discount =
          applyDiscount && discountValue
            ? { type: discountType as DiscountType, value: discountValue }
            : null;

        const charge = buildTuitionCharge({
          baseAmount: billingAmount,
          dueDay: billingDueDay,
          discount,
        });

        billing = await tx.billing.create({
          data: {
            invoiceNumber: await nextInvoiceNumber(tx),
            parentId: finalParentId,
            type: "TUITION",
            description: `Mensalidade ${gradeLevel} - ${firstName} ${lastName}`,
            amount: charge.amount,
            dueDate: charge.dueDate,
            status: "DRAFT",
            isRecurring: true,
            recurrence: "MONTHLY",
            nextBillingDate: charge.nextBillingDate,
            notes: tuitionChargeNote(charge, discount),
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

    return created(result, { message: responseMessage + billingMessage });
  } catch (error: any) {
    return serverError(error, "Erro ao criar aluno");
  }
}, { permission: "student:write" });
