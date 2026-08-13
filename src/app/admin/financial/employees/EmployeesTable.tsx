"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  cpf: string | null;
  phoneNumber: string;
  position: string;
  employeeType: string;
  salary: number;
  user: {
    email: string;
    isActive: boolean;
  };
}

export default function EmployeesTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/employees?search=${search}&type=${typeFilter}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        const errorMsg = data.error || "Erro ao carregar funcionários";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Erro ao carregar funcionários";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSelectAll = () => {
    if (selectedIds.size === employees.length && !selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
      setSelectAll(false);
    }
  };

  const handleSelectAllPages = () => {
    setSelectAll(true);
    setSelectedIds(new Set(employees.map((e) => e.id)));
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      setSelectAll(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    const count = selectAll ? totalCount : selectedIds.size;

    if (!confirm(`Tem certeza que deseja excluir ${count} funcionário(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/employees/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectAll ? [] : Array.from(selectedIds),
          deleteAll: selectAll,
          search: selectAll ? search : undefined,
          type: selectAll ? typeFilter : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSelectedIds(new Set());
        setSelectAll(false);
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir funcionários");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = selectAll ? totalCount : selectedIds.size;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir funcionário");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TEACHER":
        return "Professor";
      case "STAFF":
        return "Staff";
      case "ADMIN":
        return "Administrativo";
      default:
        return type;
    }
  };

  return (
    <div>
      {/* Filters and Actions */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSelectedIds(new Set());
            setSelectAll(false);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
            setSelectedIds(new Set());
            setSelectAll(false);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos os Tipos</option>
          <option value="TEACHER">Professor</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Administrativo</option>
        </select>

        {selectedCount > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-6 rounded-sm transition"
          >
            {isDeleting ? "Excluindo..." : `Excluir (${selectedCount})`}
          </button>
        )}
      </div>

      {/* Selection Banners */}
      {selectedIds.size > 0 && !selectAll && selectedIds.size === employees.length && totalPages > 1 && (
        <div className="mb-4 bg-gray-100 border border-gray-300 rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {selectedIds.size} funcionário(s) selecionado(s) nesta página.
          </span>
          <button
            onClick={handleSelectAllPages}
            className="text-sm font-semibold text-gray-900 hover:underline"
          >
            Selecionar todos os {totalCount} funcionários
          </button>
        </div>
      )}

      {selectAll && (
        <div className="mb-4 bg-gray-900 text-white rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm">
            Todos os {totalCount} funcionários estão selecionados.
          </span>
          <button
            onClick={() => {
              setSelectAll(false);
              setSelectedIds(new Set());
            }}
            className="text-sm font-semibold hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Table */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Erro: {error}</p>
          <button
            onClick={() => fetchEmployees()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-sm"
          >
            Tentar Novamente
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum funcionário encontrado</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === employees.length && employees.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">ID</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-3 font-semibold text-gray-700">CPF</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Cargo</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Salário</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      selectedIds.has(employee.id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(employee.id)}
                        onChange={() => handleToggleSelect(employee.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-sm font-semibold text-gray-600">
                      {employee.employeeId}
                    </td>
                    <td className="p-3">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {employee.cpf || "-"}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {employee.position}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                        {getTypeLabel(employee.employeeType)}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-green-700">
                      R$ {employee.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          employee.user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {employee.user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/financial/employees/${employee.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/financial/employees/${employee.id}/edit`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-semibold"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(
                              employee.id,
                              `${employee.firstName} ${employee.lastName}`
                            )
                          }
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          Excluir
                        </button>
                      </div>
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
