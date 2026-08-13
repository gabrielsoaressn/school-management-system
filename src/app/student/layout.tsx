import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { STUDENT_NAV } from "@/lib/navigation";

export default function StudentPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell sections={STUDENT_NAV}>{children}</AppShell>;
}
