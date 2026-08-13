/**
 * Domain constants.
 *
 * These were left over from a generic template: grades "9" to "12", sections A-D,
 * subjects in English and terms called "Term 1" — none of which matched the
 * school. The values here are the ones the seed, the forms and the classes
 * actually use.
 *
 * Employee types are NOT here: they live in src/lib/employee-types.ts, which is
 * the single source (this file used to carry a second, three-value version).
 */

/** 1º to 9º Ano do Ensino Fundamental. */
export const GRADE_LEVELS = [
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "6º Ano",
  "7º Ano",
  "8º Ano",
  "9º Ano",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const SECTIONS = ["A", "B", "C"] as const;

export type Section = (typeof SECTIONS)[number];

/** Bimestres: the school's assessment periods. */
export const TERMS = [
  "1º Bimestre",
  "2º Bimestre",
  "3º Bimestre",
  "4º Bimestre",
] as const;

export type Term = (typeof TERMS)[number];

export const GENDERS = {
  MALE: "Masculino",
  FEMALE: "Feminino",
  OTHER: "Outro",
} as const;

export const USER_ROLES = {
  ADMIN: "Administrador",
  FINANCE: "Financeiro",
  SECRETARY: "Secretaria",
  COORDINATOR: "Coordenação",
  TEACHER: "Professor",
  STAFF: "Funcionário",
  PARENT: "Responsável",
  STUDENT: "Aluno",
} as const;

export const PAYMENT_STATUSES = {
  DRAFT: "Aguardando aprovação",
  PENDING: "Em aberto",
  PARTIALLY_PAID: "Pago em parte",
  PAID: "Pago",
  OVERDUE: "Vencido",
  RENEGOTIATED: "Renegociado",
  CANCELLED: "Cancelado",
} as const;

export const PAYMENT_METHODS = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CARD: "Cartão",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
} as const;

export const ATTENDANCE_STATUSES = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  LATE: "Atraso",
  EXCUSED: "Falta justificada",
} as const;

export const ENROLLMENT_STATUSES = {
  ACTIVE: "Cursando",
  COMPLETED: "Aprovado",
  RETAINED: "Retido",
  TRANSFERRED: "Transferido",
  CANCELLED: "Cancelado",
} as const;

export const ACADEMIC_YEAR_STATUSES = {
  PLANNING: "Em planejamento",
  ACTIVE: "Em andamento",
  CLOSED: "Encerrado",
} as const;

export const BILLING_TYPES = {
  TUITION: "Mensalidade",
  MATERIAL: "Material",
  EVENT: "Evento",
  OTHER: "Outro",
} as const;

export const RECURRENCE_TYPES = {
  NONE: "Sem recorrência",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  ANNUALLY: "Anual",
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: "Percentual",
  FIXED_AMOUNT: "Valor fixo",
} as const;

export const EXPENSE_CATEGORIES = [
  "Folha de pagamento",
  "Água, luz e telefone",
  "Manutenção",
  "Material de consumo",
  "Equipamentos",
  "Transporte",
  "Impostos e taxas",
  "Outros",
] as const;

/**
 * Subjects by grade, used to seed a grade's curriculum. The authority for what a
 * class actually teaches is ClassSubjectTeacher, not this list.
 */
export const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  "1º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
  ],
  "2º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
  ],
  "3º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
  ],
  "4º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
  "5º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
  "6º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
  "7º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
  "8º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
  "9º Ano": [
    "Português",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Artes",
    "Educação Física",
    "Inglês",
  ],
};

export const DAYS_OF_WEEK = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
] as const;
