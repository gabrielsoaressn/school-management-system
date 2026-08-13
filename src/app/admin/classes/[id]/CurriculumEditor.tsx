"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { BookOpen, Save } from "lucide-react";

interface QualifiedTeacher {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  qualifiedTeachers: QualifiedTeacher[];
}

interface Assignment {
  subjectId: string;
  teacherId: string | null;
  weeklyPeriods: number | null;
}

/**
 * The curriculum of a class: which subjects it teaches and who teaches each one.
 *
 * Assigning a teacher here is not decoration — it is what lets that teacher open
 * the class register and the grade sheet for that subject. Unstaffed subjects are
 * called out, because nobody can enter grades for them.
 */
export default function CurriculumEditor({ classId }: { classId: string }) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [assignments, setAssignments] = useState<Map<string, Assignment>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/classes/${classId}/curriculum`);
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Erro ao carregar a grade");
        return;
      }

      setSubjects(data.data.subjects);
      setAssignments(
        new Map(
          data.data.assignments.map((assignment: any) => [
            assignment.subjectId,
            {
              subjectId: assignment.subjectId,
              teacherId: assignment.teacherId,
              weeklyPeriods: assignment.weeklyPeriods,
            },
          ])
        )
      );
    } catch {
      toast.error("Erro ao carregar a grade");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const toggleSubject = (subjectId: string, enabled: boolean) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      if (enabled) {
        next.set(subjectId, { subjectId, teacherId: null, weeklyPeriods: 2 });
      } else {
        next.delete(subjectId);
      }
      return next;
    });
  };

  const setTeacher = (subjectId: string, teacherId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(subjectId);
      if (current) {
        next.set(subjectId, { ...current, teacherId: teacherId || null });
      }
      return next;
    });
  };

  const setPeriods = (subjectId: string, value: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(subjectId);
      if (current) {
        next.set(subjectId, {
          ...current,
          weeklyPeriods: value === "" ? null : Number(value),
        });
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/classes/${classId}/curriculum`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: [...assignments.values()] }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message ?? "Grade atualizada");
        load();
      } else {
        toast.error(data.error || "Erro ao salvar a grade");
      }
    } catch {
      toast.error("Erro ao salvar a grade");
    } finally {
      setSaving(false);
    }
  };

  const unstaffed = [...assignments.values()].filter(
    (assignment) => !assignment.teacherId
  ).length;

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Grade curricular
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O professor vinculado a uma disciplina passa a poder lançar notas e
            chamada dela nesta turma.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar grade"}
        </Button>
      </div>

      {unstaffed > 0 && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
          {unstaffed} disciplina(s) sem professor. Ninguém poderá lançar notas ou
          chamada delas até que um professor seja definido.
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Carregando grade...
        </p>
      ) : subjects.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Não há disciplinas cadastradas para esta série.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-10 py-2"></th>
                <th className="py-2 font-semibold text-foreground">Disciplina</th>
                <th className="py-2 font-semibold text-foreground">Professor</th>
                <th className="w-28 py-2 font-semibold text-foreground">
                  Aulas/semana
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const assignment = assignments.get(subject.id);
                const enabled = Boolean(assignment);

                return (
                  <tr
                    key={subject.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          toggleSubject(subject.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                        aria-label={`Incluir ${subject.name} na grade`}
                      />
                    </td>
                    <td className="py-2">
                      <span
                        className={
                          enabled ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {subject.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {subject.code}
                      </span>
                    </td>
                    <td className="py-2">
                      <select
                        value={assignment?.teacherId ?? ""}
                        onChange={(e) => setTeacher(subject.id, e.target.value)}
                        disabled={!enabled}
                        className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="">
                          {subject.qualifiedTeachers.length === 0
                            ? "Nenhum professor habilitado"
                            : "Sem professor"}
                        </option>
                        {subject.qualifiedTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={assignment?.weeklyPeriods ?? ""}
                        onChange={(e) => setPeriods(subject.id, e.target.value)}
                        disabled={!enabled}
                        className="w-20 rounded-lg border border-input bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
