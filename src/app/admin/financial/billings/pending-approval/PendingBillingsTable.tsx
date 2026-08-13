"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/money";

interface Billing {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  dueDate: string;
  notes: string | null;
  parent: {
    firstName: string;
    lastName: string;
  };
}

export default function PendingBillingsTable() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingBillings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/billings/pending-approval`);
      const data = await response.json();

      if (response.ok) {
        setBillings(data.data);
      } else {
        toast.error(data.error || "Erro ao carregar cobranças");
      }
    } catch {
      toast.error("Erro ao carregar cobranças");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBillings();
  }, []);

  const handleApprove = async (id: string, invoiceNumber: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/billings/${id}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Cobrança ${invoiceNumber} aprovada!`);
        fetchPendingBillings();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao aprovar cobrança");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, invoiceNumber: string) => {
    if (
      !confirm(`Tem certeza que deseja rejeitar a cobrança ${invoiceNumber}?`)
    ) {
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/billings/${id}/reject`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Cobrança ${invoiceNumber} rejeitada e cancelada`);
        fetchPendingBillings();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao rejeitar cobrança");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveAll = async () => {
    if (
      !confirm(
        `Tem certeza que deseja aprovar todas as ${billings.length} cobranças?`
      )
    ) {
      return;
    }

    setProcessing("all");
    try {
      const response = await fetch(`/api/admin/billings/approve-all`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchPendingBillings();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Erro ao aprovar cobranças");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (billings.length === 0) {
    return (
      <div className="rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
        <p className="text-lg text-gray-500">
          ✅ Nenhuma cobrança aguardando aprovação
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Todas as cobranças foram revisadas
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with bulk action */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {billings.length} cobrança(s) aguardando aprovação
        </div>
        <button
          onClick={handleApproveAll}
          disabled={processing === "all"}
          className="rounded-sm bg-black px-6 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {processing === "all" ? "Aprovando..." : "Aprovar Todas"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="p-3 text-left font-semibold text-gray-700">
                Nº Fatura
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Responsável
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Descrição
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Valor
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Vencimento
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Observações
              </th>
              <th className="p-3 text-left font-semibold text-gray-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {billings.map((billing) => (
              <tr
                key={billing.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="p-3 font-mono text-sm">
                  {billing.invoiceNumber}
                </td>
                <td className="p-3">
                  {billing.parent.firstName} {billing.parent.lastName}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {billing.description}
                </td>
                <td className="p-3 font-semibold">
                  {formatCurrency(billing.amount)}
                </td>
                <td className="p-3 text-sm">
                  {new Date(billing.dueDate).toLocaleDateString("pt-BR")}
                </td>
                <td className="max-w-xs truncate p-3 text-xs text-gray-500">
                  {billing.notes || "-"}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleApprove(billing.id, billing.invoiceNumber)
                      }
                      disabled={processing === billing.id}
                      className="rounded-sm bg-black px-3 py-1 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                    >
                      {processing === billing.id ? "..." : "Aprovar"}
                    </button>
                    <button
                      onClick={() =>
                        handleReject(billing.id, billing.invoiceNumber)
                      }
                      disabled={processing === billing.id}
                      className="rounded-sm bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-900 transition hover:bg-gray-300 disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
