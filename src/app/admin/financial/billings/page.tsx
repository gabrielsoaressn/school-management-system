import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import BillingsTable from "./BillingsTable";

export default async function BillingsPage() {
  await requirePermission("billing:read");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Contas a Receber
              </h1>
              <p className="text-gray-600">
                Gerenciar cobranças de responsáveis
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
                href="/admin/financial/billings/new"
                className="rounded-sm bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
              >
                + Nova Cobrança
              </Link>
            </div>
          </div>

          <BillingsTable />
        </div>
      </div>
    </div>
  );
}
