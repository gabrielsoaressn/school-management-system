"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as icons from "lucide-react";
import { Menu, X, Info, ArrowLeftRight, Bell } from "lucide-react";
import Logo from "@/components/ui/logo";
import { DEMO_NAV } from "@demo/lib/nav";
import { DEMO_USERS, type Role } from "@demo/lib/mock";

/**
 * Casca das telas da demo: sidebar + faixa de aviso + seletor de perfil.
 *
 * Espelha src/components/layout/Sidebar.tsx, sem o que depende de sessão — no
 * lugar do "Sair" há a troca de perfil, que é o que o visitante quer fazer.
 */
export function DemoShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = DEMO_USERS[role];
  const sections = DEMO_NAV[role];

  // O export estático usa trailingSlash, então o pathname chega como
  // "/admin/students/" — comparar sem a barra final evita perder o destaque.
  const current = pathname.replace(/\/$/, "") || "/";
  const isActive = (href: string, exact?: boolean) =>
    exact
      ? current === href
      : current === href || current.startsWith(`${href}/`);

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <Logo size="md" showText={true} href="/" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon =
                  (icons[
                    item.icon as keyof typeof icons
                  ] as icons.LucideIcon) ?? icons.Circle;
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
        <p className="truncate text-sm font-medium text-foreground">
          {user.name}
        </p>
        <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
        <Link
          href="/"
          className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
          Trocar de perfil
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <DemoNotice />

      <div className="lg:flex">
        {/* Barra superior no mobile */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <Logo size="sm" showText={true} href="/" />
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

        <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
          {nav}
        </aside>

        <div className="min-w-0 flex-1">
          {/* O app põe o sino de notificações aqui; na demo ele é estático. */}
          <div className="flex items-center justify-end gap-2 border-b border-border bg-card px-4 py-2 lg:px-6">
            <span className="relative inline-flex items-center rounded-lg p-2 text-muted-foreground">
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </span>
          </div>
          <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Faixa fixa: quem chega pelo link não pode confundir a demo com o sistema. */
export function DemoNotice() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-primary px-4 py-2 text-center text-xs text-primary-foreground">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Demonstração estática — todos os dados são fictícios e nada é salvo.
      </span>
      {/* A cor precisa ser explícita: globals.css pinta todo <a> de
          text-primary, que aqui seria azul sobre azul. */}
      <a
        href="https://github.com/gabrielsoaressn/school-management-system"
        className="font-semibold text-primary-foreground underline underline-offset-2"
      >
        Ver o código
      </a>
    </div>
  );
}

export default DemoShell;
