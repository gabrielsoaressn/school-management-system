"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  section: string;
  dateOfBirth: string;
  user: {
    email: string;
    isActive: boolean;
  };
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null;
  enrollments: Array<{
    class: {
      name: string;
      academicYear: string;
    };
  }>;
}

export default function StudentsTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/students?search=${search}&gradeLevel=${gradeFilter}&page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setStudents(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        const errorMsg = data.message || "Erro ao carregar alunos";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Erro ao carregar alunos";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, gradeFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSelectAll = () => {
    if (selectedIds.size === students.length && !selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
      setSelectAll(false);
    }
  };

  const handleSelectAllPages = () => {
    setSelectAll(true);
    setSelectedIds(new Set(students.map((s) => s.id)));
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

    if (!confirm(`Tem certeza que deseja excluir ${count} aluno(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/students/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectAll ? [] : Array.from(selectedIds),
          deleteAll: selectAll,
          search: selectAll ? search : undefined,
          gradeLevel: selectAll ? gradeFilter : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSelectedIds(new Set());
        setSelectAll(false);
        fetchStudents();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro ao excluir alunos");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = selectAll ? totalCount : selectedIds.size;

  return (
    <div>
      {/* Filters and Actions */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Buscar por nome ou ID..."
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
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setPage(1);
            setSelectedIds(new Set());
            setSelectAll(false);
          }}
          className="px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todas as Séries</option>
          <option value="1º Ano">1º Ano</option>
          <option value="2º Ano">2º Ano</option>
          <option value="3º Ano">3º Ano</option>
          <option value="4º Ano">4º Ano</option>
          <option value="5º Ano">5º Ano</option>
          <option value="6º Ano">6º Ano</option>
          <option value="7º Ano">7º Ano</option>
          <option value="8º Ano">8º Ano</option>
          <option value="9º Ano">9º Ano</option>
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
      {selectedIds.size > 0 && !selectAll && selectedIds.size === students.length && totalPages > 1 && (
        <div className="mb-4 bg-gray-100 border border-gray-300 rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {selectedIds.size} aluno(s) selecionado(s) nesta página.
          </span>
          <button
            onClick={handleSelectAllPages}
            className="text-sm font-semibold text-gray-900 hover:underline"
          >
            Selecionar todos os {totalCount} alunos
          </button>
        </div>
      )}

      {selectAll && (
        <div className="mb-4 bg-gray-900 text-white rounded-sm p-3 flex justify-between items-center">
          <span className="text-sm">
            Todos os {totalCount} alunos estão selecionados.
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
            onClick={() => fetchStudents()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-sm"
          >
            Tentar Novamente
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum aluno encontrado</p>
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
                      checked={selectedIds.size === students.length && students.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">ID</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Série</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Seção</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Responsável</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Turma</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      selectedIds.has(student.id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => handleToggleSelect(student.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-sm font-semibold text-gray-600">
                      {student.studentId}
                    </td>
                    <td className="p-3">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {student.gradeLevel}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {student.section}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {student.parent
                        ? `${student.parent.firstName} ${student.parent.lastName}`
                        : "-"}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {student.enrollments.length > 0
                        ? student.enrollments[0].class.name
                        : "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          student.user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/students/${student.id}/edit`}
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
