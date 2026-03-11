import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Process recurring billings (create new billings from recurring ones)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all recurring billings that are due for processing
    const recurringBillings = await prisma.billing.findMany({
      where: {
        isRecurring: true,
        recurrence: {
          not: "NONE",
        },
        nextBillingDate: {
          lte: today,
        },
      },
      include: {
        parent: true,
      },
    });

    if (recurringBillings.length === 0) {
      return NextResponse.json({
        message: "Nenhuma cobrança recorrente pendente para processar",
        data: { processed: 0 },
      });
    }

    // Process each recurring billing
    const results = await Promise.all(
      recurringBillings.map(async (billing) => {
        try {
          // Generate new invoice number
          const billingCount = await prisma.billing.count();
          const invoiceNumber = `INV${new Date().getFullYear()}${String(billingCount + 1).padStart(6, "0")}`;

          // Calculate next billing dates
          const currentDueDate = billing.nextBillingDate!;
          let nextBillingDate = new Date(currentDueDate);

          switch (billing.recurrence) {
            case "MONTHLY":
              nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
              break;
            case "QUARTERLY":
              nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
              break;
            case "ANNUALLY":
              nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
              break;
          }

          // Create new billing and update the original in a transaction
          await prisma.$transaction(async (tx) => {
            // Create new billing
            await tx.billing.create({
              data: {
                invoiceNumber,
                parentId: billing.parentId,
                type: billing.type,
                description: billing.description,
                amount: billing.amount,
                dueDate: currentDueDate,
                status: "PENDING",
                isRecurring: false, // New billing is not recurring itself
                recurrence: "NONE",
                nextBillingDate: null,
                notes: `Gerado automaticamente de cobrança recorrente ${billing.invoiceNumber}`,
              },
            });

            // Update original billing with next billing date
            await tx.billing.update({
              where: { id: billing.id },
              data: {
                nextBillingDate,
              },
            });
          });

          return {
            success: true,
            invoiceNumber,
            parentName: `${billing.parent.firstName} ${billing.parent.lastName}`,
          };
        } catch (error) {
          console.error(`Error processing recurring billing ${billing.id}:`, error);
          return {
            success: false,
            invoiceNumber: billing.invoiceNumber,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processadas ${successCount} cobranças recorrentes com sucesso`,
      data: {
        processed: successCount,
        failed: failureCount,
        details: results,
      },
    });
  } catch (error: any) {
    console.error("Error processing recurring billings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao processar cobranças recorrentes" },
      { status: 500 }
    );
  }
}
