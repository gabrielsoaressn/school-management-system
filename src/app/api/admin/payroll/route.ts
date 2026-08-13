import { prisma } from "@/lib/prisma";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

// GET - List all payroll records
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const employeeId = searchParams.get("employeeId") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = {};

    if (search) {
      where.OR = [
        { paymentId: { contains: search, mode: "insensitive" as const } },
        {
          employee: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { cpf: { contains: search, mode: "insensitive" as const } },
              { employeeId: { contains: search, mode: "insensitive" as const } },
            ],
          },
        },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (month) {
      where.referenceMonth = parseInt(month);
    }

    if (year) {
      where.referenceYear = parseInt(year);
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              position: true,
              cpf: true,
              salary: true,
            },
          },
        },
        orderBy: {
          scheduledDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payroll.count({ where }),
    ]);

    return paginated(payrolls, { total: total, page: page, limit: limit });
  } catch (error: any) {
    return serverError(error, "Erro ao buscar folha de pagamento");
  }
}, { permission: "payroll:read" });

// POST - Create new payroll record
export const POST = withAuth(async (request, { user }) => {
  try {

    const body = await request.json();
    const {
      employeeId,
      baseSalary,
      bonus,
      deductions,
      referenceMonth,
      referenceYear,
      scheduledDate,
      notes,
    } = body;

    // Validate required fields
    if (
      !employeeId ||
      baseSalary === undefined ||
      !referenceMonth ||
      !referenceYear ||
      !scheduledDate
    ) {
      return fail("Campos obrigatórios faltando", 400);
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return fail("Funcionário não encontrado", 404);
    }

    // Check if payroll already exists for this employee in this period
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_referenceMonth_referenceYear: {
          employeeId,
          referenceMonth: parseInt(referenceMonth),
          referenceYear: parseInt(referenceYear),
        },
      },
    });

    if (existingPayroll) {
      return fail("Já existe um pagamento para este funcionário neste período", 400);
    }

    // Calculate total amount
    const bonusAmount = bonus ? parseFloat(bonus) : 0;
    const deductionsAmount = deductions ? parseFloat(deductions) : 0;
    const totalAmount = parseFloat(baseSalary) + bonusAmount - deductionsAmount;

    // Generate unique payment ID
    const payrollCount = await prisma.payroll.count();
    const paymentId = `PAY${new Date().getFullYear()}${String(payrollCount + 1).padStart(6, "0")}`;

    // Create payroll
    const payroll = await prisma.payroll.create({
      data: {
        paymentId,
        employeeId,
        baseSalary: parseFloat(baseSalary),
        bonus: bonusAmount,
        deductions: deductionsAmount,
        totalAmount,
        referenceMonth: parseInt(referenceMonth),
        referenceYear: parseInt(referenceYear),
        status: "SCHEDULED",
        scheduledDate: new Date(scheduledDate),
        notes: notes || null,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    await recordAudit({
      action: "payroll.create",
      entity: "Payroll",
      entityId: payroll.id,
      actor: user,
      request,
      after: payroll,
    });

    return created(payroll, { message: "Pagamento programado com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao criar pagamento");
  }
}, { permission: "payroll:write" });
