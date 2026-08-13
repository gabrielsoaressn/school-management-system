import { prisma } from "@/lib/prisma";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";

// GET - List all billings
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const parentId = searchParams.get("parentId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        {
          parent: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { cpf: { contains: search, mode: "insensitive" as const } },
            ],
          },
        },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (parentId) {
      where.parentId = parentId;
    }

    const [billings, total] = await Promise.all([
      prisma.billing.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cpf: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          dueDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.billing.count({ where }),
    ]);

    return paginated(billings, { total: total, page: page, limit: limit });
  } catch (error: any) {
    return serverError(error, "Erro ao buscar cobranças");
  }
}, { permission: "billing:read" });

// POST - Create new billing
export const POST = withAuth(async (request, { user }) => {
  try {

    const body = await request.json();
    const {
      parentId,
      type,
      description,
      amount,
      dueDate,
      isRecurring,
      recurrence,
      notes,
    } = body;

    // Validate required fields
    if (!parentId || !type || !description || !amount || !dueDate) {
      return fail("Campos obrigatórios faltando", 400);
    }

    // Check if parent exists
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return fail("Responsável não encontrado", 404);
    }

    // Generate unique invoice number
    const billingCount = await prisma.billing.count();
    const invoiceNumber = `INV${new Date().getFullYear()}${String(billingCount + 1).padStart(6, "0")}`;

    // Calculate next billing date if recurring
    let nextBillingDate = null;
    if (isRecurring && recurrence !== "NONE") {
      const dueDateObj = new Date(dueDate);
      switch (recurrence) {
        case "MONTHLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case "ANNUALLY":
          nextBillingDate = new Date(dueDateObj);
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }
    }

    // Create billing
    const billing = await prisma.billing.create({
      data: {
        invoiceNumber,
        parentId,
        type,
        description,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "PENDING",
        isRecurring: isRecurring || false,
        recurrence: recurrence || "NONE",
        nextBillingDate,
        notes: notes || null,
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return created(billing, { message: "Cobrança criada com sucesso" });
  } catch (error: any) {
    return serverError(error, "Erro ao criar cobrança");
  }
}, { permission: "billing:write" });
