import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { subtract } from "@/lib/money";
import { endOfMonth, startOfMonth } from "@/lib/datetime";

// GET - Financial summary for dashboard
export const GET = withAuth(async (request, { user }) => {
  try {

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || String(new Date().getMonth() + 1);
    const year = searchParams.get("year") || String(new Date().getFullYear());

    const referenceMonth = parseInt(month);
    const referenceYear = parseInt(year);

    // Calculate date range for the month
    const startDate = startOfMonth(referenceYear, referenceMonth);
    const endDate = endOfMonth(referenceYear, referenceMonth);

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
        expected: subtract(totalBillings._sum.amount, totalPayroll._sum.totalAmount),
        actual: subtract(paidBillings._sum.amount, completedPayroll._sum.totalAmount),
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

    return ok(summary);
  } catch (error: any) {
    return serverError(error, "Erro ao buscar resumo financeiro");
  }
}, { permission: "billing:read" });
