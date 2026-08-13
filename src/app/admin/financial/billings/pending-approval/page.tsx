import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import PendingBillingsTable from "./PendingBillingsTable";

export default async function PendingApprovalPage() {
  const user = await requirePermission("billing:approve");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cobranças Pendentes de Aprovação</h1>
              <p className="text-gray-600">Revise e aprove as cobranças criadas automaticamente</p>
            </div>
            <Link
              href="/admin/financial/billings"
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-sm transition"
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
