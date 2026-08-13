import { can } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/lib/api-auth";

/** Payroll figures and banking details, hidden from roles without the capability. */
const EMPLOYEE_FINANCIAL_FIELDS = [
  "salary",
  "pixKey",
  "bankName",
  "bankAgency",
  "bankAccount",
] as const;

/**
 * Strips salary and banking data from employee records unless the caller holds
 * `employee:salary:read` (ADMIN and FINANCE only). Applied at the API boundary
 * so no screen can surface the figures by accident.
 */
export function redactEmployeeFinancials<T extends Record<string, unknown>>(
  employee: T,
  user: AuthenticatedUser
): T {
  if (can(user, "employee:salary:read")) {
    return employee;
  }

  const clean = { ...employee };
  for (const field of EMPLOYEE_FINANCIAL_FIELDS) {
    if (field in clean) {
      delete (clean as Record<string, unknown>)[field];
    }
  }
  return clean;
}

export function redactEmployeeList<T extends Record<string, unknown>>(
  employees: T[],
  user: AuthenticatedUser
): T[] {
  if (can(user, "employee:salary:read")) {
    return employees;
  }
  return employees.map((employee) => redactEmployeeFinancials(employee, user));
}
