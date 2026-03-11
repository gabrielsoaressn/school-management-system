import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import PayrollForm from "./PayrollForm";

export default async function NewPayrollPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Novo Pagamento
          </h1>
          <p className="text-gray-600 mb-6">
            Programar um novo pagamento de funcionário
          </p>

          <PayrollForm employees={employees} />
        </div>
      </div>
    </div>
  );
}
