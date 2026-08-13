import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/datetime";
import { formatCurrency, sum } from "@/lib/money";

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

  // Get tuition info for all students
  const tuitions = await prisma.tuition.findMany({
    where: {
      studentId: {
        in: parent?.students.map((s) => s.id) || [],
      },
    },
    orderBy: {
      dueDate: "desc",
    },
    take: 10,
  });

  const pendingTuitions = tuitions.filter((t) => t.status === "PENDING").length;
  const totalDue = sum(
    tuitions.filter((t) => t.status === "PENDING").map((t) => t.amount)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
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

            {/* Pending Tuitions Card */}
            <div className="bg-orange-600 text-white rounded-sm p-6 border border-orange-700">
              <h3 className="text-lg font-semibold mb-2">Mensalidades Pendentes</h3>
              <p className="text-3xl font-bold">{pendingTuitions}</p>
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

          {/* Recent Tuitions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mensalidades Recentes
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
                  {tuitions.map((tuition) => (
                    <tr key={tuition.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tuition.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(tuition.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(tuition.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tuition.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : tuition.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tuition.status === "PAID"
                            ? "Pago"
                            : tuition.status === "PENDING"
                            ? "Pendente"
                            : "Atrasado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tuitions.length === 0 && (
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
