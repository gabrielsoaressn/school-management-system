"use client";

import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ClipboardCheck, Info } from "lucide-react";
import { formatDate, formatPercent } from "@demo/lib/format";
import {
  ATTENDANCE_LABEL,
  CLASS_ROSTER,
  SCHOOL,
  TEACHER_CLASSES,
  type AttendanceStatus,
} from "@demo/lib/mock";

const OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const OPTION_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: "border-success bg-success/10 text-success",
  ABSENT: "border-destructive bg-destructive/10 text-destructive",
  LATE: "border-warning bg-warning/10 text-warning",
  EXCUSED: "border-info bg-info/10 text-info",
};

export default function TeacherAttendanceDemo() {
  const turma = TEACHER_CLASSES[0];
  // A chamada abre com todos presentes, como no app: o professor só marca a
  // exceção.
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(
      CLASS_ROSTER.map((student) => [student.id, "PRESENT" as AttendanceStatus])
    )
  );
  const [saved, setSaved] = useState(false);

  const counts = OPTIONS.map(
    (status) =>
      Object.values(records).filter((value) => value === status).length
  );
  const presentLike = Object.values(records).filter(
    (status) => status === "PRESENT" || status === "LATE"
  ).length;

  return (
    <PageWrapper>
      <PageHeader
        title="Chamada"
        subtitle={`${turma.name} · ${turma.subject} · ${formatDate(SCHOOL.today)}`}
        icon={ClipboardCheck}
      >
        <Button variant="primary" onClick={() => setSaved(true)}>
          Salvar chamada
        </Button>
      </PageHeader>

      {saved && (
        <Card padding="md" className="mb-4 border-info/30 bg-info/10">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Info className="h-4 w-4 shrink-0 text-info" aria-hidden="true" />
            Na demo nada é gravado — no sistema, a frequência entra no boletim e
            o responsável passa a ver as faltas do dia.
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {OPTIONS.map((status, index) => (
          <Card key={status} padding="md">
            <p className="text-sm text-muted-foreground">
              {ATTENDANCE_LABEL[status]}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {counts[index]}
            </p>
          </Card>
        ))}
        <Card padding="md" className="border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground">Frequência da aula</p>
          <p className="text-2xl font-bold text-primary">
            {formatPercent((presentLike / CLASS_ROSTER.length) * 100)}
          </p>
        </Card>
      </div>

      <Card padding="none" className="divide-y divide-border">
        {CLASS_ROSTER.map((student) => (
          <div
            key={student.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">
                <span className="mr-2 text-muted-foreground">
                  {student.number}.
                </span>
                {student.name}
              </p>
            </div>
            <div
              role="group"
              aria-label={`Presença de ${student.name}`}
              className="flex flex-wrap gap-2"
            >
              {OPTIONS.map((status) => {
                const active = records[student.id] === status;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSaved(false);
                      setRecords((current) => ({
                        ...current,
                        [student.id]: status,
                      }));
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? OPTION_CLASS[status]
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ATTENDANCE_LABEL[status]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>
    </PageWrapper>
  );
}
