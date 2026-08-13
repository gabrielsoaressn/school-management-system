import type { EmployeeType, UserRole } from "@prisma/client";

export const EMPLOYEE_TYPES = {
  TEACHER: "Professor",
  COORDINATOR: "Coordenador",
  ADMINISTRATIVE: "Administrativo",
  MAINTENANCE: "Manutenção",
  CLEANING: "Limpeza",
  CLASSROOM_ASSISTANT: "Auxiliar de Sala",
  HALLWAY_ASSISTANT: "Auxiliar de Corredor",
  PSYCHOLOGIST: "Psicólogo",
  PRINCIPAL: "Diretor",
  STAFF: "Funcionário",
  ADMIN: "Administrador",
} as const;

export type EmployeeTypeKey = keyof typeof EMPLOYEE_TYPES;

export function getEmployeeTypeLabel(type: EmployeeTypeKey): string {
  return EMPLOYEE_TYPES[type] || type;
}

export function getEmployeeTypeOptions() {
  return Object.entries(EMPLOYEE_TYPES).map(([value, label]) => ({
    value,
    label,
  }));
}

/**
 * Login role granted when an employee is created.
 *
 * Anything not listed here gets STAFF: a valid login with no portal access.
 * Employees used to be created as ADMIN regardless of their job, which handed
 * payroll and salary visibility to every teacher and support worker.
 */
const ROLE_BY_EMPLOYEE_TYPE: Partial<Record<EmployeeType, UserRole>> = {
  TEACHER: "TEACHER",
  COORDINATOR: "COORDINATOR",
  ADMINISTRATIVE: "SECRETARY",
  PRINCIPAL: "ADMIN",
  ADMIN: "ADMIN",
};

export function userRoleForEmployeeType(type: EmployeeType): UserRole {
  return ROLE_BY_EMPLOYEE_TYPE[type] ?? "STAFF";
}
