"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/datetime";
import { MessageSquareWarning, Plus } from "lucide-react";

interface StudentOption {
  id: string;
  name: string;
  placement: string;
}

interface Occurrence {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  reportedByName: string;
  date: string;
  actionTaken: string | null;
  parentNotified: boolean;
  parentViewedAt: string | null;
  student: { id: string; firstName: string; lastName: string };
}

const TYPES = [
  { value: "BEHAVIORAL", label: "Comportamento" },
  { value: "ACADEMIC", label: "Acadêmico" },
  { value: "HEALTH", label: "Saúde" },
  { value: "ATTENDANCE", label: "Frequência" },
  { value: "POSITIVE", label: "Elogio" },
  { value: "OTHER", label: "Outro" },
];

const SEVERITIES = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

const SEVERITY_VARIANT: Record<
  string,
  "default" | "info" | "warning" | "destructive"
> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "destructive",
};

const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

/**
 * Occurrence board: the log, plus a form to add to it.
 *
 * Recording an occurrence notifies the guardian — the API already did that and
 * nobody could see the result, because neither this screen nor the notification
 * centre existed.
 */
export default function OccurrencesBoard({
  canWrite,
  students,
}: {
  canWrite: boolean;
  students: StudentOption[];
}) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    type: "BEHAVIORAL",
    severity: "LOW",
    title: "",
    description: "",
    actionTaken: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);

      const response = await fetch(`/api/admin/occurrences?${params}`);
      const data = await response.json();

      if (data.success) {
        setOccurrences(data.data);
      } else {
        toast.error(data.error || "Erro ao carregar ocorrências");
      }
    } catch {
      toast.error("Erro ao carregar ocorrências");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, severityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.studentId) {
      toast.error("Selecione o aluno");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          actionTaken: form.actionTaken || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message ?? "Ocorrência registrada");
        setShowForm(false);
        setForm({
          studentId: "",
          type: "BEHAVIORAL",
          severity: "LOW",
          title: "",
          description: "",
          actionTaken: "",
        });
        load();
      } else {
        toast.error(data.error || "Erro ao registrar ocorrência");
      }
    } catch {
      toast.error("Erro ao registrar ocorrência");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            label="Tipo"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[{ value: "ALL", label: "Todos os tipos" }, ...TYPES]}
          />
          <Select
            label="Gravidade"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={[
              { value: "ALL", label: "Todas as gravidades" },
              ...SEVERITIES,
            ]}
          />
          <div className="flex-1" />
          {canWrite && (
            <Button onClick={() => setShowForm((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova ocorrência
            </Button>
          )}
        </div>
      </Card>

      {showForm && canWrite && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Aluno"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                options={[
                  { value: "", label: "Selecione o aluno" },
                  ...students.map((student) => ({
                    value: student.id,
                    label: `${student.name} — ${student.placement}`,
                  })),
                ]}
                required
              />
              <Select
                label="Tipo"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={TYPES}
                required
              />
              <Select
                label="Gravidade"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                options={SEVERITIES}
                required
              />
            </div>

            <Input
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Resumo em uma linha"
              required
              minLength={3}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Descrição <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
                minLength={10}
                className="w-full rounded-lg border border-input bg-card px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="O que aconteceu, quando e com quem."
              />
            </div>

            <Input
              label="Providência tomada"
              value={form.actionTaken}
              onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
              placeholder="Opcional"
            />

            <p className="text-xs text-muted-foreground">
              O responsável pelo aluno recebe uma notificação ao salvar.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Registrar ocorrência"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando...
          </p>
        ) : occurrences.length === 0 ? (
          <EmptyState
            icon={MessageSquareWarning}
            title="Nenhuma ocorrência registrada"
            description={
              typeFilter !== "ALL" || severityFilter !== "ALL"
                ? "Nenhuma ocorrência com esses filtros."
                : "As ocorrências registradas pela equipe aparecem aqui."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {occurrences.map((occurrence) => (
              <li key={occurrence.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">
                      {occurrence.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {occurrence.student.firstName} {occurrence.student.lastName}{" "}
                      · {formatDateTime(occurrence.date)} ·{" "}
                      {occurrence.reportedByName}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Badge variant="default" size="sm">
                      {TYPE_LABEL[occurrence.type] ?? occurrence.type}
                    </Badge>
                    <Badge
                      variant={SEVERITY_VARIANT[occurrence.severity] ?? "default"}
                      size="sm"
                    >
                      {SEVERITIES.find((s) => s.value === occurrence.severity)
                        ?.label ?? occurrence.severity}
                    </Badge>
                    {occurrence.parentViewedAt ? (
                      <Badge variant="success" size="sm">
                        Visto pelo responsável
                      </Badge>
                    ) : occurrence.parentNotified ? (
                      <Badge variant="info" size="sm">
                        Responsável notificado
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                  {occurrence.description}
                </p>

                {occurrence.actionTaken && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Providência:
                    </span>{" "}
                    {occurrence.actionTaken}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
