"use client";

import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { FileText, Info } from "lucide-react";
import { formatScore } from "@demo/lib/format";
import { CLASS_ROSTER, GRADEBOOK, TEACHER_CLASSES } from "@demo/lib/mock";

type Entry = { prova1: string; trabalho: string };

const PASSING_AVERAGE = 6;

/** Média do bimestre: prova e trabalho com o mesmo peso, como no seed. */
function average(entry: Entry): number | null {
  const prova = Number(entry.prova1.replace(",", "."));
  const trabalho = Number(entry.trabalho.replace(",", "."));
  if (!entry.prova1 || !entry.trabalho) return null;
  if (Number.isNaN(prova) || Number.isNaN(trabalho)) return null;
  return (prova + trabalho) / 2;
}

export default function TeacherGradesDemo() {
  const turma = TEACHER_CLASSES[0];
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(
      CLASS_ROSTER.map((student) => [
        student.id,
        {
          prova1: String(GRADEBOOK[student.id].prova1).replace(".", ","),
          trabalho: String(GRADEBOOK[student.id].trabalho).replace(".", ","),
        },
      ])
    )
  );
  const [saved, setSaved] = useState(false);

  const update = (id: string, field: keyof Entry, value: string) => {
    setSaved(false);
    setEntries((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const averages = CLASS_ROSTER.map((student) => average(entries[student.id]));
  const filled = averages.filter((value): value is number => value !== null);
  const classAverage = filled.length
    ? filled.reduce((total, value) => total + value, 0) / filled.length
    : 0;
  const belowAverage = filled.filter((value) => value < PASSING_AVERAGE).length;

  return (
    <PageWrapper>
      <PageHeader
        title="Diário de notas"
        subtitle={`${turma.name} · ${turma.subject} · 3º bimestre`}
        icon={FileText}
      >
        <Button variant="primary" onClick={() => setSaved(true)}>
          Salvar notas
        </Button>
      </PageHeader>

      {saved && (
        <Card padding="md" className="mb-4 border-info/30 bg-info/10">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Info className="h-4 w-4 shrink-0 text-info" aria-hidden="true" />
            Na demo nada é gravado — no sistema, as notas vão para o boletim do
            aluno e ficam visíveis para o responsável.
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Média da turma</p>
          <p className="text-2xl font-bold text-foreground">
            {formatScore(classAverage)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Abaixo da média</p>
          <p className="text-2xl font-bold text-foreground">{belowAverage}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Notas lançadas</p>
          <p className="text-2xl font-bold text-foreground">
            {filled.length}/{CLASS_ROSTER.length}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <p className="mb-4 text-sm text-muted-foreground">
          Edite as notas para ver a média recalcular — de 0 a 10, com vírgula ou
          ponto.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Prova</TableHead>
              <TableHead>Trabalho</TableHead>
              <TableHead>Média</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CLASS_ROSTER.map((student, index) => {
              const mean = averages[index];
              return (
                <TableRow key={student.id} hover>
                  <TableCell className="text-muted-foreground">
                    {student.number}
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Nota da prova de ${student.name}`}
                      value={entries[student.id].prova1}
                      onChange={(event) =>
                        update(student.id, "prova1", event.target.value)
                      }
                      className="w-20 rounded-lg border border-input bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Nota do trabalho de ${student.name}`}
                      value={entries[student.id].trabalho}
                      onChange={(event) =>
                        update(student.id, "trabalho", event.target.value)
                      }
                      className="w-20 rounded-lg border border-input bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </TableCell>
                  <TableCell className="font-semibold">
                    {mean === null ? "—" : formatScore(mean)}
                  </TableCell>
                  <TableCell>
                    {mean === null ? (
                      <Badge variant="default">Sem nota</Badge>
                    ) : mean >= PASSING_AVERAGE ? (
                      <Badge variant="success">Aprovado no bimestre</Badge>
                    ) : (
                      <Badge variant="destructive">Abaixo da média</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </PageWrapper>
  );
}
