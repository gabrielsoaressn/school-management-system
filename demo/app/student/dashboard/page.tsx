import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
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
import { GraduationCap } from "lucide-react";
import { formatDate, formatPercent, formatScore } from "@demo/lib/format";
import {
  ATTENDANCE_LABEL,
  DEMO_USERS,
  STUDENT_ASSESSMENTS,
  STUDENT_ATTENDANCE,
  STUDENT_SUMMARY,
  type AttendanceStatus,
} from "@demo/lib/mock";

const ATTENDANCE_VARIANT: Record<
  AttendanceStatus,
  "success" | "destructive" | "warning" | "info"
> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  EXCUSED: "info",
};

export default function StudentDashboardDemo() {
  return (
    <PageWrapper>
      <PageHeader
        title="Painel do Aluno"
        subtitle={`Bem-vinda, ${DEMO_USERS.STUDENT.name}`}
        icon={GraduationCap}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          padding="md"
          className="border-primary bg-primary text-primary-foreground"
        >
          <h3 className="mb-2 text-lg font-semibold">Minha turma</h3>
          <p className="text-3xl font-bold">{STUDENT_SUMMARY.className}</p>
          <p className="text-sm opacity-80">
            {STUDENT_SUMMARY.classSize} alunos
          </p>
        </Card>

        <Card padding="md" className="border-success/20 bg-success/5">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Frequência
          </h3>
          <p className="text-3xl font-bold text-success">
            {formatPercent(STUDENT_SUMMARY.attendance)}
          </p>
          <p className="text-sm text-muted-foreground">
            {STUDENT_SUMMARY.presentLessons} de {STUDENT_SUMMARY.totalLessons}{" "}
            aulas
          </p>
        </Card>

        {/* Mesmo empate do painel administrativo: bg-card é emitido depois de
            bg-accent/5, então a cor precisa do "!". */}
        <Card padding="md" className="border-accent/20 !bg-accent/5">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Média geral
          </h3>
          <p className="text-3xl font-bold text-accent">
            {formatScore(STUDENT_SUMMARY.average)}
          </p>
          <p className="text-sm text-muted-foreground">
            {STUDENT_SUMMARY.assessments} avaliações
          </p>
        </Card>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Últimas avaliações
          </h2>
          <Link
            href="/student/report"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver boletim completo →
          </Link>
        </div>
        <Card padding="md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENT_ASSESSMENTS.map((assessment) => (
                <TableRow key={assessment.id} hover>
                  <TableCell>{formatDate(assessment.date)}</TableCell>
                  <TableCell className="font-medium">
                    {assessment.subject}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assessment.type}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatScore(assessment.score)} / {assessment.maxScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Frequência recente
        </h2>
        <Card padding="md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENT_ATTENDANCE.map((record, index) => (
                <TableRow key={`${record.date}-${index}`} hover>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>{record.subject}</TableCell>
                  <TableCell>
                    <Badge variant={ATTENDANCE_VARIANT[record.status]}>
                      {ATTENDANCE_LABEL[record.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </PageWrapper>
  );
}
