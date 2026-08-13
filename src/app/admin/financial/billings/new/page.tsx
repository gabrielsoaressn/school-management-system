import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import BillingForm from "./BillingForm";

export default async function NewBillingPage() {
  await requirePermission("billing:write");

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
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Nova Cobrança
          </h1>
          <p className="mb-6 text-gray-600">
            Criar uma nova cobrança para um responsável
          </p>

          <BillingForm parents={parents} />
        </div>
      </div>
    </div>
  );
}
