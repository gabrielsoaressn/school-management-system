import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import PendingBillingsTable from "./PendingBillingsTable";

export default async function PendingApprovalPage() {
  await requirePermission("billing:approve");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cobranças Pendentes de Aprovação
              </h1>
              <p className="text-gray-600">
                Revise e aprove as cobranças criadas automaticamente
              </p>
            </div>
            <Link
              href="/admin/financial/billings"
              className="rounded-sm bg-gray-200 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-300"
            >
              ← Voltar
            </Link>
          </div>

          <PendingBillingsTable />
        </div>
      </div>
    </div>
  );
}
