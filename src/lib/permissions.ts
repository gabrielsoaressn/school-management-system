import type { UserRole } from "@prisma/client";

/**
 * Capability matrix.
 *
 * `can()` answers "may this role perform this kind of operation at all?".
 * It deliberately says nothing about *which rows* the user may touch — row
 * scoping (a teacher's own classes, a parent's own children) stays in the
 * queries, next to the data.
 *
 * Type-only import of UserRole keeps this module usable from the edge
 * middleware, which cannot load the Prisma client.
 */

export const PERMISSIONS = [
  // Portal access
  "admin:panel",
  "teacher:panel",
  "parent:panel",
  "student:panel",

  // People
  "student:read",
  "student:write",
  "student:delete",
  "parent:read",
  "parent:write",
  "parent:delete",
  "employee:read",
  "employee:write",
  "employee:delete",
  // Salary figures are a separate capability from the employee record itself.
  "employee:salary:read",

  // Money
  "billing:read",
  "billing:write",
  "billing:approve",
  "billing:renegotiate",
  "billing:remind",
  "payroll:read",
  "payroll:write",

  // Academics
  "class:read",
  "class:write",
  "assessment:read",
  "assessment:write",
  "attendance:read",
  "attendance:write",
  "enrollment:read",
  "enrollment:write",

  // Communication
  "announcement:read",
  "announcement:write",
  "occurrence:read",
  "occurrence:write",

  // Documents and system
  "document:read",
  "document:generate",
  "settings:read",
  "settings:write",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = "*" as const;

/**
 * Who sees what. Two hard rules:
 * - payroll and salary figures are ADMIN and FINANCE only;
 * - the audit log is ADMIN only.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[] | typeof ALL> = {
  ADMIN: ALL,

  FINANCE: [
    "admin:panel",
    "billing:read",
    "billing:write",
    "billing:approve",
    "billing:renegotiate",
    "billing:remind",
    "payroll:read",
    "payroll:write",
    "employee:read",
    "employee:salary:read",
    "parent:read",
    "parent:write",
    "student:read",
    "settings:read",
    "document:read",
  ],

  SECRETARY: [
    "admin:panel",
    "student:read",
    "student:write",
    "parent:read",
    "parent:write",
    "employee:read",
    "class:read",
    "enrollment:read",
    "enrollment:write",
    "assessment:read",
    "attendance:read",
    "announcement:read",
    "occurrence:read",
    "billing:read",
    "document:read",
    "document:generate",
  ],

  COORDINATOR: [
    "admin:panel",
    "student:read",
    "student:write",
    "parent:read",
    "employee:read",
    "class:read",
    "class:write",
    "assessment:read",
    "assessment:write",
    "attendance:read",
    "attendance:write",
    "enrollment:read",
    "announcement:read",
    "announcement:write",
    "occurrence:read",
    "occurrence:write",
    "document:read",
    "document:generate",
  ],

  TEACHER: [
    "teacher:panel",
    "class:read",
    "student:read",
    "assessment:read",
    "assessment:write",
    "attendance:read",
    "attendance:write",
    "occurrence:write",
    "announcement:read",
  ],

  PARENT: [
    "parent:panel",
    "billing:read",
    "announcement:read",
    "occurrence:read",
    "assessment:read",
    "attendance:read",
  ],

  STUDENT: [
    "student:panel",
    "announcement:read",
    "assessment:read",
    "attendance:read",
  ],

  // Support staff (maintenance, cleaning, assistants, psychologist): a valid
  // login with no portal access until a dedicated area exists.
  STAFF: ["announcement:read"],
};

interface RoleCarrier {
  role: UserRole;
}

export function can(
  user: RoleCarrier | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  const granted = ROLE_PERMISSIONS[user.role];
  if (!granted) return false;
  return granted === ALL || granted.includes(permission);
}

export function canAny(
  user: RoleCarrier | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => can(user, permission));
}

export function permissionsFor(role: UserRole): readonly Permission[] {
  const granted = ROLE_PERMISSIONS[role];
  return granted === ALL ? PERMISSIONS : granted;
}

/**
 * Page-level access, consumed by the middleware. Longest prefix wins, so the
 * payroll entry must be evaluated before the generic /admin/financial one.
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: "/admin/financial/payroll", permission: "payroll:read" },
  { prefix: "/admin/financial/collection", permission: "billing:remind" },
  { prefix: "/admin/financial/employees", permission: "employee:read" },
  { prefix: "/admin/financial/billings", permission: "billing:read" },
  { prefix: "/admin/financial", permission: "billing:read" },
  { prefix: "/admin/settings", permission: "settings:write" },
  { prefix: "/admin/enrollment-requests", permission: "enrollment:read" },
  { prefix: "/admin/students", permission: "student:read" },
  { prefix: "/admin/teachers", permission: "employee:read" },
  { prefix: "/admin/classes", permission: "class:read" },
  { prefix: "/admin/communication", permission: "announcement:read" },
  { prefix: "/admin/documents", permission: "document:read" },
  { prefix: "/admin", permission: "admin:panel" },
  { prefix: "/teacher", permission: "teacher:panel" },
  { prefix: "/parent", permission: "parent:panel" },
  { prefix: "/student", permission: "student:panel" },
];

export function requiredPermissionFor(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find((entry) =>
    pathname.startsWith(entry.prefix)
  );
  return match?.permission ?? null;
}

/** Landing page per role, used after login and on the root redirect. */
export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  FINANCE: "/admin/financial",
  SECRETARY: "/admin/dashboard",
  COORDINATOR: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
  STAFF: "/login",
};
