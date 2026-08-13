import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/datetime";
import type { ReportCard } from "@/lib/report-card";
import { FileText } from "lucide-react";

/**
 * Report card, shared by the student's own view and the guardian's.
 *
 * Printable: the CSS hides the app chrome so Ctrl+P (or "save as PDF") produces
 * a clean sheet, which is what a school actually needs to hand over.
 */
export function ReportCardView({ report }: { report: ReportCard }) {
  const passingMark = 6;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Boletim {report.academicYear}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.student.name} · {report.student.studentId}
              {report.placement
                ? ` · ${report.placement.gradeLevel} ${report.placement.section}`
                : ""}
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Média geral</p>
              <p className="text-2xl font-bold text-foreground">
                {report.overallAverage?.toFixed(1) ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Frequência</p>
              <p className="text-2xl font-bold text-foreground">
                {report.attendance.rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Desempenho por disciplina
        </h2>

        {report.subjects.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma nota lançada"
            description={`Ainda não há avaliações registradas em ${report.academicYear}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-semibold text-foreground">
                    Disciplina
                  </th>
                  {report.terms.map((term) => (
                    <th
                      key={term}
                      className="p-3 text-center font-semibold text-foreground"
                    >
                      {term.replace(" Bimestre", "º Bim.")}
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold text-foreground">
                    Média
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((subject) => (
                  <tr
                    key={subject.subjectId}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-3">
                      <span className="font-medium text-foreground">
                        {subject.subjectName}
                      </span>
                      {subject.teacherName && (
                        <span className="block text-xs text-muted-foreground">
                          {subject.teacherName}
                        </span>
                      )}
                    </td>
                    {subject.terms.map((term) => (
                      <td key={term.term} className="p-3 text-center">
                        {term.average === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span
                            className={
                              term.average >= passingMark
                                ? "text-foreground"
                                : "font-medium text-destructive"
                            }
                          >
                            {term.average.toFixed(1)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-center">
                      {subject.yearAverage === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          variant={
                            subject.yearAverage >= passingMark
                              ? "success"
                              : "destructive"
                          }
                          size="sm"
                        >
                          {subject.yearAverage.toFixed(1)}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Média ponderada pelo peso de cada tipo de avaliação, na escala de 0 a
          10. Média mínima para aprovação: {passingMark.toFixed(1)}.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Frequência
        </h2>

        {report.attendance.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma chamada registrada em {report.academicYear}.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Aulas", value: report.attendance.total },
              { label: "Presenças", value: report.attendance.present },
              { label: "Faltas", value: report.attendance.absent },
              { label: "Atrasos", value: report.attendance.late },
              { label: "Justificadas", value: report.attendance.excused },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {report.subjects.some((subject) =>
        subject.terms.some((term) => term.assessments.length > 0)
      ) && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Avaliações lançadas
          </h2>
          <div className="space-y-4">
            {report.subjects.map((subject) => {
              const entries = subject.terms.flatMap((term) =>
                term.assessments.map((assessment) => ({
                  ...assessment,
                  term: term.term,
                }))
              );

              if (entries.length === 0) return null;

              return (
                <div key={subject.subjectId}>
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                    {subject.subjectName}
                  </h3>
                  <ul className="divide-y divide-border text-sm">
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
                      >
                        <span className="text-muted-foreground">
                          {entry.term} · {entry.type} · {formatDate(entry.date)}
                        </span>
                        <span className="text-foreground">
                          {entry.score.toFixed(1)} / {entry.maxScore.toFixed(0)}
                          {entry.remarks ? ` — ${entry.remarks}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ReportCardView;
