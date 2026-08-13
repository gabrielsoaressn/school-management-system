"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/money";

interface Billing {
  id: string;
  invoiceNumber: string;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function BillingsTable() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/billings?search=${search}&status=${statusFilter}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setBillings(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Erro ao carregar cobranças");
      }
    } catch (error) {
      toast.error("Erro ao carregar cobranças");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, [page, search, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "OVERDUE":
        return "bg-red-100 text-red-700";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Pago";
      case "PENDING":
        return "Pendente";
      case "OVERDUE":
        return "Atrasado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Buscar por número, descrição ou responsável..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos os Status</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="OVERDUE">Atrasado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : billings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma cobrança encontrada</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Nº Fatura</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Responsável</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Valor</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Vencimento</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((billing) => (
                  <tr key={billing.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">{billing.invoiceNumber}</td>
                    <td className="p-3">
                      {billing.parent.firstName} {billing.parent.lastName}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{billing.type}</td>
                    <td className="p-3 font-semibold text-green-700">
                      {formatCurrency(billing.amount)}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(billing.dueDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                          billing.status
                        )}`}
                      >
                        {getStatusLabel(billing.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/financial/billings/${billing.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
