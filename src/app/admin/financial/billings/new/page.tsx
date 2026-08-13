import { requirePermission } from "@/lib/auth-guards";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import BillingForm from "./BillingForm";

export default async function NewBillingPage() {
  const user = await requirePermission("billing:write");

  // Fetch parents for the dropdown
  const parents = await prisma.parent.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
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
            Nova Cobrança
          </h1>
          <p className="text-gray-600 mb-6">
            Criar uma nova cobrança para um responsável
          </p>

          <BillingForm parents={parents} />
        </div>
      </div>
    </div>
  );
}
