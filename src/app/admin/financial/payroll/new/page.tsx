import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import PayrollForm from "./PayrollForm";
import { toNumber } from "@/lib/money";

export default async function NewPayrollPage() {
  await requirePermission("payroll:write");

  // Fetch employees for the dropdown
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      position: true,
      salary: true,
      cpf: true,
    },
    orderBy: {
      firstName: "asc",
    },
  });

  // Decimal is a server-side type; the form is a client component, so money
  // crosses the boundary as a number, for display only.
  const employeesForForm = employees.map((employee) => ({
    ...employee,
    salary: toNumber(employee.salary),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Novo Pagamento
          </h1>
          <p className="mb-6 text-gray-600">
            Programar um novo pagamento de funcionário
          </p>

          <PayrollForm employees={employeesForForm} />
        </div>
      </div>
    </div>
  );
}
