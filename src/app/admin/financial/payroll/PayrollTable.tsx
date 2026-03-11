"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Payroll {
  id: string;
  paymentId: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  referenceMonth: number;
  referenceYear: number;
  status: string;
  scheduledDate: string;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    position: string;
  };
}

export default function PayrollTable() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/payroll?search=${search}&status=${statusFilter}&month=${monthFilter}&year=${yearFilter}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setPayrolls(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message || "Erro ao carregar folha de pagamento");
      }
    } catch (error) {
      toast.error("Erro ao carregar folha de pagamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [page, search, statusFilter, monthFilter, yearFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Efetuado";
      case "SCHEDULED":
        return "Programado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Buscar por funcionário..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {monthNames.map((month, index) => (
            <option key={index} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos os Status</option>
          <option value="SCHEDULED">Programado</option>
          <option value="COMPLETED">Efetuado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">ID Pagamento</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Funcionário</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Cargo</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Período</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Salário Base</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Total</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-sm">{payroll.paymentId}</td>
                    <td className="p-3">
                      {payroll.employee.firstName} {payroll.employee.lastName}
                    </td>
                    <td className="p-3 text-sm text-gray-600">{payroll.employee.position}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {monthNames[payroll.referenceMonth - 1]}/{payroll.referenceYear}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      R$ {payroll.baseSalary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-semibold text-green-700">
                      R$ {payroll.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                          payroll.status
                        )}`}
                      >
                        {getStatusLabel(payroll.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/financial/payroll/${payroll.id}`}
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
