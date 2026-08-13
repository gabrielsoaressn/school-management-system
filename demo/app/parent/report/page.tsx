import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import { FileText } from "lucide-react";
import ReportCardTable from "@demo/components/ReportCardTable";
import { PARENT_CHILDREN, SCHOOL } from "@demo/lib/mock";

export default function ParentReportDemo() {
  const child = PARENT_CHILDREN[0];

  return (
    <PageWrapper>
      <PageHeader
        title={`Boletim — ${child.name}`}
        subtitle={`${child.className} · ano letivo ${SCHOOL.academicYear} · regente ${child.homeroomTeacher}`}
        icon={FileText}
      />
      <ReportCardTable studentName={child.name} />
    </PageWrapper>
  );
}
