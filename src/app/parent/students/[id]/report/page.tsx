import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import ReportCardView from "@/components/academic/ReportCardView";
import PrintButton from "@/components/academic/PrintButton";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { buildReportCard } from "@/lib/report-card";
import { FileText } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * A guardian's view of one child's report card.
 *
 * The guardian link is checked here, not assumed from the URL: passing another
 * family's student id gives a 404, not somebody else's grades.
 */
export default async function ParentReportPage({ params }: Props) {
  const user = await requireUser();

  if (user.role !== "PARENT") {
    redirect("/");
  }

  const { id } = await params;

  const isTheirChild = await prisma.student.findFirst({
    where: {
      id,
      OR: [
        { parent: { userId: user.id } },
        { guardianRelationships: { some: { parent: { userId: user.id } } } },
      ],
    },
    select: { id: true },
  });

  if (!isTheirChild) {
    notFound();
  }

  const report = await buildReportCard(id);

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
      <div className="mb-4 flex items-center justify-between print:hidden">
        <BackButton href="/parent/dashboard" label="Voltar ao painel" />
        <PrintButton />
      </div>
      <ReportCardView report={report} />
    </>
  );
}
