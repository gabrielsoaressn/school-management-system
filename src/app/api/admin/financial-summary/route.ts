import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Financial summary for dashboard
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || String(new Date().getMonth() + 1);
    const year = searchParams.get("year") || String(new Date().getFullYear());

    const referenceMonth = parseInt(month);
    const referenceYear = parseInt(year);

    // Calculate date range for the month
    const startDate = new Date(referenceYear, referenceMonth - 1, 1);
    const endDate = new Date(referenceYear, referenceMonth, 0, 23, 59, 59);

    // Fetch all financial data in parallel
    const [
      // Billings (Contas a Receber)
      totalBillings,
      paidBillings,
      pendingBillings,
      overdueBillings,

      // Payroll (Contas a Pagar)
      totalPayroll,
      completedPayroll,
      scheduledPayroll,

      // Counts
      totalParents,
      totalEmployees,

      // Recent transactions
      recentBillings,
      recentPayrolls,
    ] = await Promise.all([
      // Billings aggregations
      prisma.billing.aggregate({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      prisma.billing.aggregate({
        where: {
          status: "PAID",
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      prisma.billing.aggregate({
        where: {
          status: "PENDING",
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      prisma.billing.aggregate({
        where: {
          status: "OVERDUE",
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      // Payroll aggregations
      prisma.payroll.aggregate({
        where: {
          referenceMonth,
          referenceYear,
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      prisma.payroll.aggregate({
        where: {
          status: "COMPLETED",
          referenceMonth,
          referenceYear,
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      prisma.payroll.aggregate({
        where: {
          status: "SCHEDULED",
          referenceMonth,
          referenceYear,
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),

      // Counts
      prisma.parent.count(),
      prisma.employee.count(),

      // Recent transactions
      prisma.billing.findMany({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      prisma.payroll.findMany({
        where: {
          referenceMonth,
          referenceYear,
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
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    // Calculate summary
    const summary = {
      // Contas a Receber
      accountsReceivable: {
        total: totalBillings._sum.amount || 0,
        paid: paidBillings._sum.amount || 0,
        pending: pendingBillings._sum.amount || 0,
        overdue: overdueBillings._sum.amount || 0,
        totalCount: totalBillings._count || 0,
        paidCount: paidBillings._count || 0,
        pendingCount: pendingBillings._count || 0,
        overdueCount: overdueBillings._count || 0,
      },

      // Contas a Pagar
      accountsPayable: {
        total: totalPayroll._sum.totalAmount || 0,
        completed: completedPayroll._sum.totalAmount || 0,
        scheduled: scheduledPayroll._sum.totalAmount || 0,
        totalCount: totalPayroll._count || 0,
        completedCount: completedPayroll._count || 0,
        scheduledCount: scheduledPayroll._count || 0,
      },

      // Balance
      balance: {
        expected: (totalBillings._sum.amount || 0) - (totalPayroll._sum.totalAmount || 0),
        actual: (paidBillings._sum.amount || 0) - (completedPayroll._sum.totalAmount || 0),
      },

      // Counts
      counts: {
        parents: totalParents,
        employees: totalEmployees,
      },

      // Recent transactions
      recentTransactions: {
        billings: recentBillings,
        payrolls: recentPayrolls,
      },

      // Reference period
      period: {
        month: referenceMonth,
        year: referenceYear,
      },
    };

    return NextResponse.json({ data: summary });
  } catch (error: any) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar resumo financeiro" },
      { status: 500 }
    );
  }
}
