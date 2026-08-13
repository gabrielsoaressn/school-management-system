import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/lib/navigation";

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return <AppShell sections={ADMIN_NAV}>{children}</AppShell>;
}
