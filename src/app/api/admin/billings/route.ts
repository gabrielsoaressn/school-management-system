import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all billings
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({
      data: billings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching billings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar cobranças" },
      { status: 500 }
    );
  }
}

// POST - Create new billing
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if parent exists
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Responsável não encontrado" },
        { status: 404 }
      );
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

    return NextResponse.json(
      { message: "Cobrança criada com sucesso", data: billing },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating billing:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar cobrança" },
      { status: 500 }
    );
  }
}
