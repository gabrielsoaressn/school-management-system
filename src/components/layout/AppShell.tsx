import { ReactNode } from "react";
import { requireUser } from "@/lib/auth-guards";
import { can } from "@/lib/permissions";
import { USER_ROLES } from "@/lib/constants";
import type { NavSection } from "@/lib/navigation";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/layout/NotificationBell";

interface Props {
  sections: NavSection[];
  children: ReactNode;
}

/**
 * Portal frame: sidebar plus content.
 *
 * Navigation is filtered here, on the server, against the same permission matrix
 * the middleware and the APIs use — so a role never sees a link it cannot open.
 */
export default async function AppShell({ sections, children }: Props) {
  const user = await requireUser();

  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || can(user, item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar
        sections={visible}
        userEmail={user.email}
        roleLabel={USER_ROLES[user.role] ?? user.role}
      />

      <div className="min-w-0 flex-1">
        <div className="flex justify-end border-b border-border bg-card px-4 py-2 lg:px-6">
          <NotificationBell />
        </div>
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
