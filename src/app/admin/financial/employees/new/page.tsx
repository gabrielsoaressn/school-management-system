import { requirePermission } from "@/lib/auth-guards";
import Logo from "@/components/ui/logo";
import EmployeeForm from "./EmployeeForm";

export default async function NewEmployeePage() {
  const user = await requirePermission("employee:write");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Novo Funcionário
          </h1>
          <p className="text-gray-600 mb-6">
            Preencha os dados abaixo para cadastrar um novo funcionário
          </p>

          <EmployeeForm />
        </div>
      </div>
    </div>
  );
}
