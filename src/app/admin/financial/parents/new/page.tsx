import { requirePermission } from "@/lib/auth-guards";
import ParentForm from "./ParentForm";

export default async function NewParentPage() {
  await requirePermission("parent:write");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Novo Responsável Financeiro
          </h1>
          <p className="mb-6 text-gray-600">
            Preencha os dados abaixo para cadastrar um novo responsável
          </p>

          <ParentForm />
        </div>
      </div>
    </div>
  );
}
