import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/datetime";
import { formatCurrency, sum } from "@/lib/money";
import { Prisma } from "@prisma/client";
import { computeAmountDue, loadLateChargeSettings } from "@/lib/billing-rules";
import { subtract } from "@/lib/money";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PARTIALLY_PAID: "Pago em parte",
  PAID: "Pago",
  OVERDUE: "Atrasado",
  RENEGOTIATED: "Renegociado",
  CANCELLED: "Cancelado",
};

export default async function ParentDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "PARENT") {
    redirect("/login");
  }

  // Fetch parent data and their students
  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
            },
          },
        },
      },
    },
  });

  const studentsCount = parent?.students.length || 0;

  // Charges come from Billing, the same model the school's financial module
  // emits, so the guardian sees exactly what the school issued — including the
  // fine and interest of anything overdue.
  const billings = parent
    ? await prisma.billing.findMany({
        where: {
          parentId: parent.id,
          status: { not: "DRAFT" },
        },
        include: { payments: { select: { amount: true } } },
        orderBy: { dueDate: "desc" },
        take: 10,
      })
    : [];

  const lateCharges = await loadLateChargeSettings();
  const now = new Date();

  const charges = billings.map((billing) => {
    const due = computeAmountDue(billing, now, lateCharges);
    const paid = sum(billing.payments.map((payment) => payment.amount));

    return {
      ...billing,
      due,
      paid,
      outstanding: Prisma.Decimal.max(subtract(due.total, paid), 0),
    };
  });

  const openCharges = charges.filter(
    (charge) => !["PAID", "CANCELLED"].includes(charge.status)
  );
  const openChargeCount = openCharges.length;
  const totalDue = sum(openCharges.map((charge) => charge.outstanding));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel do Responsável
          </h1>
          <p className="text-gray-600 mb-6">Bem-vindo, {user.email}!</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Students Card */}
            <div className="bg-blue-600 text-white rounded-sm p-6 border border-blue-700">
              <h3 className="text-lg font-semibold mb-2">Meus Filhos</h3>
              <p className="text-3xl font-bold">{studentsCount}</p>
              <p className="text-sm text-blue-100">Alunos cadastrados</p>
            </div>

            {/* Cobranças em aberto */}
            <div className="bg-orange-600 text-white rounded-sm p-6 border border-orange-700">
              <h3 className="text-lg font-semibold mb-2">Cobranças em Aberto</h3>
              <p className="text-3xl font-bold">{openChargeCount}</p>
              <p className="text-sm text-orange-100">Aguardando pagamento</p>
            </div>

            {/* Total Due Card */}
            <div className="bg-red-600 text-white rounded-sm p-6 border border-red-700">
              <h3 className="text-lg font-semibold mb-2">Total a Pagar</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(totalDue)}
              </p>
              <p className="text-sm text-red-100">Valor pendente</p>
            </div>
          </div>

          {/* Students List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Meus Filhos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parent?.students.map((student) => (
                <div
                  key={student.id}
                  className="bg-gray-50 rounded-sm border border-gray-200 p-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Email: {student.user.email}
                  </p>
                  {student.enrollments && student.enrollments.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Turma: {student.enrollments[0].class.name}
                    </p>
                  )}
                </div>
              ))}
              {studentsCount === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Nenhum aluno cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Cobranças recentes */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cobranças Recentes
            </h2>
            <div className="bg-gray-50 rounded-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fatura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {charges.map((charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {charge.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(charge.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">
                          {formatCurrency(charge.outstanding)}
                        </span>
                        {charge.due.daysLate > 0 && (
                          <span className="block text-xs text-gray-500">
                            {formatCurrency(charge.due.principal)} +{" "}
                            {formatCurrency(charge.due.fine)} multa +{" "}
                            {formatCurrency(charge.due.interest)} juros ·{" "}
                            {charge.due.daysLate} dia(s) de atraso
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            charge.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : charge.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {charge.status === "PAID"
                            ? "Pago"
                            : charge.status === "PENDING"
                            ? "Pendente"
                            : "Atrasado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {charges.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Nenhuma mensalidade encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
