import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { PARENT_NAV } from "@/lib/navigation";

export default function ParentPortalLayout({ children }: { children: ReactNode }) {
  return <AppShell sections={PARENT_NAV}>{children}</AppShell>;
}
