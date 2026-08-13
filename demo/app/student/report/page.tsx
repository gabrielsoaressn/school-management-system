import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import { FileText } from "lucide-react";
import ReportCardTable from "@demo/components/ReportCardTable";
import { DEMO_USERS, SCHOOL, STUDENT_SUMMARY } from "@demo/lib/mock";

export default function StudentReportDemo() {
  return (
    <PageWrapper>
      <PageHeader
        title="Meu boletim"
        subtitle={`${STUDENT_SUMMARY.className} · ano letivo ${SCHOOL.academicYear}`}
        icon={FileText}
      />
      <ReportCardTable studentName={DEMO_USERS.STUDENT.name} />
    </PageWrapper>
  );
}
