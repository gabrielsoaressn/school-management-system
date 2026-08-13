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
import { ClipboardList, FileCheck2, FileWarning } from "lucide-react";
import { formatDate } from "@demo/lib/format";
import { ENROLLMENT_REQUESTS, type EnrollmentRequest } from "@demo/lib/mock";

const STATUS: Record<
  EnrollmentRequest["status"],
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  PENDING: { label: "Aguardando análise", variant: "warning" },
  APPROVED: { label: "Aprovada", variant: "success" },
  REJECTED: { label: "Recusada", variant: "destructive" },
};

export default function AdminEnrollmentRequestsDemo() {
  const pending = ENROLLMENT_REQUESTS.filter((r) => r.status === "PENDING");

  return (
    <PageWrapper>
      <PageHeader
        title="Matrículas online"
        subtitle={`${pending.length} solicitação(ões) aguardando análise`}
        icon={ClipboardList}
      />

      <Card padding="md" className="mb-6 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          O formulário público de matrícula grava a solicitação e os documentos
          enviados pelo responsável. A secretaria analisa, aprova e o sistema
          cria aluno, responsável e enturmação — sem redigitação.
        </p>
      </Card>

      <Card padding="md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Enviada em</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ENROLLMENT_REQUESTS.map((request) => {
              const complete = request.documents >= request.documentsExpected;
              return (
                <TableRow key={request.id} hover>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {request.protocol}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.student}
                  </TableCell>
                  <TableCell>{request.gradeLevel}</TableCell>
                  <TableCell>{request.guardian}</TableCell>
                  <TableCell>{formatDate(request.submittedAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm ${
                        complete ? "text-success" : "text-warning"
                      }`}
                    >
                      {complete ? (
                        <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <FileWarning className="h-4 w-4" aria-hidden="true" />
                      )}
                      {request.documents}/{request.documentsExpected}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS[request.status].variant}>
                      {STATUS[request.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      title="Indisponível na demo"
                    >
                      Analisar
                    </Button>
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
