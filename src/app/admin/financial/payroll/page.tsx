import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import PayrollTable from "./PayrollTable";

export default async function PayrollPage() {
  await requirePermission("payroll:read");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Folha de Pagamento
              </h1>
              <p className="text-gray-600">
                Gerenciar pagamentos de funcionários
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/financial"
                className="rounded-sm bg-gray-600 px-4 py-2 font-semibold text-white transition hover:bg-gray-700"
              >
                ← Voltar
              </Link>
              <Link
                href="/admin/financial/payroll/new"
                className="rounded-sm bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
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
