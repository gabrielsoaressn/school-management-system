import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ReportCardView from "@/components/academic/ReportCardView";
import PrintButton from "@/components/academic/PrintButton";
import { buildReportCard } from "@/lib/report-card";
import { FileText } from "lucide-react";

/** The student's own report card. */
export default async function StudentReportPage() {
  const user = await requireUser();

  if (user.role !== "STUDENT") {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Cadastro de aluno não encontrado"
          description="Sua conta não está vinculada a um cadastro de aluno."
        />
      </Card>
    );
  }

  const report = await buildReportCard(student.id);

  if (!report) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Sem boletim disponível"
          description="Não há matrícula registrada para o ano letivo corrente."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <ReportCardView report={report} />
    </>
  );
}
