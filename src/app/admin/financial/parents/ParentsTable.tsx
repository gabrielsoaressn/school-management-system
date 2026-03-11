"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string | null;
  phoneNumber: string;
  email: string | null;
  user: {
    email: string;
    isActive: boolean;
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  }>;
}

export default function ParentsTable() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/parents?search=${search}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setParents(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      } else {
        toast.error(data.message || "Erro ao carregar responsáveis");
      }
    } catch (error) {
      toast.error("Erro ao carregar responsáveis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [page, search]);

  const handleSelectAll = () => {
    if (selectedIds.size === parents.length && !selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parents.map(p => p.id)));
      setSelectAll(false);
    }
  };

  const handleSelectAllPages = () => {
    setSelectAll(true);
    setSelectedIds(new Set(parents.map(p => p.id)));
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

    if (!confirm(`Tem certeza que deseja excluir ${count} responsável(is)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/parents/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectAll ? [] : Array.from(selectedIds),
          deleteAll: selectAll,
          search: selectAll ? search : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSelectedIds(new Set());
        setSelectAll(false);
        fetchParents();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro ao excluir responsáveis");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = selectAll ? totalCount : selectedIds.size;

  return (
    <div>
      {/* Search and Actions */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSelectedIds(new Set());
            setSelectAll(false);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        {selectedCount > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-sm transition disabled:opacity-50"
          >
            {isDeleting ? "Excluindo..." : `Excluir (${selectedCount})`}
          </button>
        )}
      </div>

      {/* Selection Banner */}
      {selectedIds.size > 0 && !selectAll && selectedIds.size === parents.length && totalPages > 1 && (
        <div className="mb-4 bg-gray-100 border border-gray-300 rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {selectedIds.size} responsável(is) selecionado(s) nesta página.
          </span>
          <button
            onClick={handleSelectAllPages}
            className="text-sm font-semibold text-black hover:underline"
          >
            Selecionar todos os {totalCount} responsáveis
          </button>
        </div>
      )}

      {selectAll && (
        <div className="mb-4 bg-black text-white rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm">
            Todos os {totalCount} responsáveis estão selecionados.
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
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : parents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum responsável encontrado</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === parents.length && parents.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-3 font-semibold text-gray-700">CPF</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Alunos</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr
                    key={parent.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      selectedIds.has(parent.id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(parent.id)}
                        onChange={() => handleToggleSelect(parent.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      {parent.firstName} {parent.lastName}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {parent.cpf || "-"}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {parent.phoneNumber}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {parent.user.email}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {parent.students.length} aluno(s)
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          parent.user.isActive
                            ? "bg-gray-200 text-gray-900"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {parent.user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/financial/parents/${parent.id}`}
                          className="text-black hover:text-gray-600 text-sm font-semibold"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/financial/parents/${parent.id}/edit`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-semibold"
                        >
                          Editar
                        </Link>
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
                className="px-4 py-2 bg-black text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-black text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
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
