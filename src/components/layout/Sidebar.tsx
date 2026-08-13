"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as icons from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import Logo from "@/components/ui/logo";
import type { NavSection } from "@/lib/navigation";

interface Props {
  sections: NavSection[];
  userEmail: string;
  roleLabel: string;
}

/**
 * Persistent navigation.
 *
 * Sections arrive already filtered by permission on the server, so this
 * component never has to reason about what the user may open — it only draws it.
 * Collapses to a sheet on mobile.
 */
export function Sidebar({ sections, userEmail, roleLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <Logo size="md" showText={true} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                // Icons are named in src/lib/navigation.ts so that file stays
                // free of React imports.
                const Icon =
                  (icons[item.icon as keyof typeof icons] as icons.LucideIcon) ??
                  icons.Circle;
                const active = isActive(item.href, item.exact);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
        <div className="mt-3 flex flex-col gap-1 text-sm">
          <Link
            href="/trocar-senha"
            className="text-muted-foreground hover:text-foreground"
          >
            Alterar senha
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-left text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <Logo size="sm" showText={true} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            {nav}
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        {nav}
      </aside>
    </>
  );
}

export default Sidebar;
