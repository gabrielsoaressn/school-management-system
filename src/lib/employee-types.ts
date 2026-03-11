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
