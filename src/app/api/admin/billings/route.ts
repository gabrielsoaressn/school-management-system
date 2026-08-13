import { prisma } from "@/lib/prisma";
import { created, fail, paginated, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { nextInvoiceNumber } from "@/lib/identifiers";
import { computeNextBillingDate } from "@/lib/billing-rules";
import { parseDate } from "@/lib/datetime";
import { toCents } from "@/lib/money";

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
    const invoiceNumber = await nextInvoiceNumber();

    // Same helper the daily job uses, so the series pointer is computed one way
    // only — and in the school's timezone, with end-of-month clamping.
    const parsedDueDate = parseDate(dueDate);
    const nextBillingDate =
      isRecurring && recurrence !== "NONE"
        ? computeNextBillingDate(parsedDueDate, recurrence)
        : null;

    // Create billing
    const billing = await prisma.billing.create({
      data: {
        invoiceNumber,
        parentId,
        type,
        description,
        amount: toCents(amount),
        dueDate: parsedDueDate,
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
