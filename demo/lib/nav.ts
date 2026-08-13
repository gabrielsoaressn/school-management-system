import type { Role } from "@demo/lib/mock";

/**
 * Menu da demo, por perfil.
 *
 * O app monta o menu a partir de src/lib/navigation.ts filtrado por permissão;
 * aqui a lista é fixa, porque a demo não tem sessão — o visitante troca de
 * perfil no seletor do topo. Os ícones são nomes do lucide-react, resolvidos
 * pela sidebar, como no app.
 */

export interface DemoNavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export interface DemoNavSection {
  title: string;
  items: DemoNavItem[];
}

export const DEMO_NAV: Record<Role, DemoNavSection[]> = {
  ADMIN: [
    {
      title: "Visão geral",
      items: [
        { label: "Painel", href: "/admin/dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Acadêmico",
      items: [
        { label: "Alunos", href: "/admin/students", icon: "GraduationCap" },
        { label: "Turmas", href: "/admin/classes", icon: "BookOpen" },
        {
          label: "Matrículas online",
          href: "/admin/enrollment-requests",
          icon: "ClipboardList",
        },
      ],
    },
    {
      title: "Financeiro",
      items: [
        {
          label: "Resumo",
          href: "/admin/financial",
          icon: "DollarSign",
          exact: true,
        },
        {
          label: "Cobranças",
          href: "/admin/financial/billings",
          icon: "Receipt",
        },
      ],
    },
  ],
  TEACHER: [
    {
      title: "Portal do professor",
      items: [
        {
          label: "Painel",
          href: "/teacher/dashboard",
          icon: "LayoutDashboard",
        },
        { label: "Diário de notas", href: "/teacher/grades", icon: "FileText" },
        {
          label: "Chamada",
          href: "/teacher/attendance",
          icon: "ClipboardCheck",
        },
      ],
    },
  ],
  PARENT: [
    {
      title: "Portal do responsável",
      items: [
        { label: "Painel", href: "/parent/dashboard", icon: "LayoutDashboard" },
        { label: "Boletim", href: "/parent/report", icon: "FileText" },
      ],
    },
  ],
  STUDENT: [
    {
      title: "Portal do aluno",
      items: [
        {
          label: "Painel",
          href: "/student/dashboard",
          icon: "LayoutDashboard",
        },
        { label: "Boletim", href: "/student/report", icon: "FileText" },
      ],
    },
  ],
};
