import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import PayrollTable from "./PayrollTable";

export default async function PayrollPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Folha de Pagamento</h1>
              <p className="text-gray-600">Gerenciar pagamentos de funcionários</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/financial"
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-sm transition"
              >
                ← Voltar
              </Link>
              <Link
                href="/admin/financial/payroll/new"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-sm transition"
              >
                + Novo Pagamento
              </Link>
            </div>
          </div>

          <PayrollTable />
        </div>
      </div>
    </div>
  );
}
