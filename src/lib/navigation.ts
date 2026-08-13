import type { Permission } from "@/lib/permissions";

/**
 * The application's navigation, in one place.
 *
 * Each entry declares the capability it needs, so the sidebar shows a role
 * exactly what that role can open — no separate list to keep in step with
 * src/lib/permissions.ts, and no menu item that leads to a redirect.
 */

export interface NavItem {
  label: string;
  href: string;
  /** Icon name from lucide-react, resolved by the sidebar. */
  icon: string;
  permission?: Permission;
  /** Match child routes too (default: exact match plus nested paths). */
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    title: "Visão geral",
    items: [
      {
        label: "Painel",
        href: "/admin/dashboard",
        icon: "LayoutDashboard",
        permission: "admin:panel",
      },
    ],
  },
  {
    title: "Acadêmico",
    items: [
      {
        label: "Alunos",
        href: "/admin/students",
        icon: "GraduationCap",
        permission: "student:read",
      },
      {
        label: "Professores",
        href: "/admin/teachers",
        icon: "Users",
        permission: "employee:read",
      },
      {
        label: "Turmas",
        href: "/admin/classes",
        icon: "BookOpen",
        permission: "class:read",
      },
      {
        label: "Matrículas online",
        href: "/admin/enrollment-requests",
        icon: "ClipboardList",
        permission: "enrollment:read",
      },
      {
        label: "Rematrícula",
        href: "/admin/re-enrollment",
        icon: "ArrowRightLeft",
        permission: "enrollment:write",
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
        permission: "billing:read",
        exact: true,
      },
      {
        label: "Cobranças",
        href: "/admin/financial/billings",
        icon: "Receipt",
        permission: "billing:read",
      },
      {
        label: "Régua de cobrança",
        href: "/admin/financial/collection",
        icon: "AlertTriangle",
        permission: "billing:remind",
      },
      {
        label: "Folha de pagamento",
        href: "/admin/financial/payroll",
        icon: "Wallet",
        permission: "payroll:read",
      },
      {
        label: "Responsáveis",
        href: "/admin/financial/parents",
        icon: "UserCheck",
        permission: "parent:read",
      },
      {
        label: "Funcionários",
        href: "/admin/financial/employees",
        icon: "Briefcase",
        permission: "employee:read",
      },
    ],
  },
  {
    title: "Comunicação",
    items: [
      {
        label: "Avisos",
        href: "/admin/communication/announcements",
        icon: "Megaphone",
        permission: "announcement:read",
      },
      {
        label: "Ocorrências",
        href: "/admin/communication/occurrences",
        icon: "MessageSquareWarning",
        permission: "occurrence:read",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        label: "Configurações",
        href: "/admin/settings",
        icon: "Settings",
        permission: "settings:write",
      },
    ],
  },
];

export const TEACHER_NAV: NavSection[] = [
  {
    title: "Minhas turmas",
    items: [
      {
        label: "Painel",
        href: "/teacher/dashboard",
        icon: "LayoutDashboard",
        permission: "teacher:panel",
      },
    ],
  },
];

export const PARENT_NAV: NavSection[] = [
  {
    title: "Acompanhamento",
    items: [
      {
        label: "Painel",
        href: "/parent/dashboard",
        icon: "LayoutDashboard",
        permission: "parent:panel",
      },
    ],
  },
];

export const STUDENT_NAV: NavSection[] = [
  {
    title: "Meus dados",
    items: [
      {
        label: "Painel",
        href: "/student/dashboard",
        icon: "LayoutDashboard",
        permission: "student:panel",
      },
      {
        label: "Boletim",
        href: "/student/report",
        icon: "FileText",
        permission: "assessment:read",
      },
    ],
  },
];
