import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import PayrollTable from "./PayrollTable";

export default async function PayrollPage() {
  const user = await requirePermission("payroll:read");

  return (
    <div className="min-h-screen bg-gray-50">
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
