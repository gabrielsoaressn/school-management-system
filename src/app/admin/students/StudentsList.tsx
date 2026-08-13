"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import { GRADE_LEVELS } from "@/lib/constants";
import { GraduationCap } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  user: { email: string; isActive: boolean };
  parent: { firstName: string; lastName: string; phoneNumber: string } | null;
  enrollments: {
    gradeLevel: string;
    section: string;
    status: string;
    class: { name: string };
    academicYear: { year: number };
  }[];
}

/**
 * Student listing with search, grade filter and pagination.
 *
 * The grade shown is the current enrolment's — a student not enrolled this year
 * is flagged rather than silently displayed as if placed.
 */
export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [gradeLevel, setGradeLevel] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(gradeLevel !== "ALL" ? { gradeLevel } : {}),
      });

      const response = await fetch(`/api/admin/students?${params}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        toast.error(data.error || "Erro ao carregar alunos");
      }
    } catch {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, [page, search, gradeLevel]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar
            placeholder="Buscar por nome ou matrícula..."
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
          />
        </div>
        <select
          value={gradeLevel}
          onChange={(e) => {
            setPage(1);
            setGradeLevel(e.target.value);
          }}
          className="rounded-lg border border-input bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">Todas as séries</option>
          {GRADE_LEVELS.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Carregando...
        </p>
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum aluno encontrado"
          description={
            search || gradeLevel !== "ALL"
              ? "Ajuste a busca ou o filtro de série."
              : "Cadastre o primeiro aluno."
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {total} aluno(s)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-semibold text-foreground">Aluno</th>
                  <th className="p-3 font-semibold text-foreground">Matrícula</th>
                  <th className="p-3 font-semibold text-foreground">Turma</th>
                  <th className="p-3 font-semibold text-foreground">Responsável</th>
                  <th className="p-3 font-semibold text-foreground">Situação</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const enrollment = student.enrollments[0];

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="p-3">
                        <span className="font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {student.user.email}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {student.studentId}
                      </td>
                      <td className="p-3">
                        {enrollment ? (
                          <>
                            <span className="text-foreground">
                              {enrollment.gradeLevel} {enrollment.section}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {enrollment.academicYear.year}
                            </span>
                          </>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Sem matrícula no ano
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {student.parent ? (
                          <>
                            <span className="text-foreground">
                              {student.parent.firstName} {student.parent.lastName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {student.parent.phoneNumber}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={student.user.isActive ? "success" : "default"}
                          size="sm"
                        >
                          {student.user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
