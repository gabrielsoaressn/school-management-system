import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { TEACHER_NAV } from "@/lib/navigation";

export default function TeacherPortalLayout({ children }: { children: ReactNode }) {
  return <AppShell sections={TEACHER_NAV}>{children}</AppShell>;
}
