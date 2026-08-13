"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string | null;
}

interface BillingFormProps {
  parents: Parent[];
}

export default function BillingForm({ parents }: BillingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentId: "",
    type: "",
    description: "",
    amount: "",
    dueDate: "",
    isRecurring: false,
    recurrence: "NONE",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
        recurrence: checked ? "MONTHLY" : "NONE",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/billings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        router.push("/admin/financial/billings");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao criar cobrança");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Parent Selection */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Responsável Financeiro *
        </label>
        <select
          name="parentId"
          value={formData.parentId}
          onChange={handleChange}
          required
          className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Selecione um responsável</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.firstName} {parent.lastName}
              {parent.cpf && ` - CPF: ${parent.cpf}`}
            </option>
          ))}
        </select>
      </div>

      {/* Billing Type */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Tipo de Cobrança *
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Selecione o tipo</option>
          <option value="TUITION">Mensalidade</option>
          <option value="MATERIAL">Material Escolar</option>
          <option value="EVENT">Evento/Atividade</option>
          <option value="OTHER">Outros</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Descrição *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Descrição da cobrança..."
          className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Amount and Due Date */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Valor (R$) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Data de Vencimento *
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Recurring Billing */}
      <div className="rounded-sm border border-gray-300 p-4">
        <div className="mb-3 flex items-center">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label className="ml-2 text-sm font-semibold text-gray-700">
            Cobrança Recorrente
          </label>
        </div>

        {formData.isRecurring && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Periodicidade
            </label>
            <select
              name="recurrence"
              value={formData.recurrence}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="ANNUALLY">Anual</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              A próxima cobrança será gerada automaticamente após o vencimento
              desta.
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Observações
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Observações adicionais..."
          className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar Cobrança"}
        </button>
        <Link
          href="/admin/financial/billings"
          className="rounded-sm bg-gray-200 px-6 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
