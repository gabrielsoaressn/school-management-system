import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import ClassForm from "./ClassForm";

export default async function NewClassPage() {
  await requirePermission("class:write");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Criar Nova Turma
            </h1>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
          <ClassForm />
        </div>
      </div>
    </div>
  );
}
