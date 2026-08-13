import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatScore } from "@demo/lib/format";
import { REPORT_CARD } from "@demo/lib/mock";

const PASSING_AVERAGE = 6;

/**
 * O boletim é a mesma tela para o aluno e para o responsável — no app, as duas
 * rotas leem as mesmas avaliações, só muda quem pode abrir.
 */
export function ReportCardTable({ studentName }: { studentName: string }) {
  const rows = REPORT_CARD.map((subject) => {
    const closed = [subject.bimester1, subject.bimester2];
    const average = closed.reduce((a, b) => a + b, 0) / closed.length;
    return { ...subject, average };
  });

  const overall =
    rows.reduce((total, row) => total + row.average, 0) / rows.length;
  const absences = rows.reduce((total, row) => total + row.absences, 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Média geral</p>
          <p className="text-2xl font-bold text-foreground">
            {formatScore(overall)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Faltas no ano</p>
          <p className="text-2xl font-bold text-foreground">{absences}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Situação</p>
          <p className="text-2xl font-bold text-success">Aprovado</p>
        </Card>
      </div>

      <Card padding="md">
        <p className="mb-4 text-sm text-muted-foreground">
          Boletim de {studentName} — 3º bimestre em andamento, notas ainda não
          fechadas.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Disciplina</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>1º bim.</TableHead>
              <TableHead>2º bim.</TableHead>
              <TableHead>3º bim.</TableHead>
              <TableHead>Média</TableHead>
              <TableHead>Faltas</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.subject} hover>
                <TableCell className="font-medium">{row.subject}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.teacher}
                </TableCell>
                <TableCell>{formatScore(row.bimester1)}</TableCell>
                <TableCell>{formatScore(row.bimester2)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.bimester3 === null ? "—" : formatScore(row.bimester3)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatScore(row.average)}
                </TableCell>
                <TableCell>{row.absences}</TableCell>
                <TableCell>
                  {row.average >= PASSING_AVERAGE ? (
                    <Badge variant="success">Aprovado</Badge>
                  ) : (
                    <Badge variant="warning">Recuperação</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default ReportCardTable;
