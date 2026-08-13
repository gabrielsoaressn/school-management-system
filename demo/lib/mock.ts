/**
 * Dados fictícios da demo.
 *
 * Uma escola inteira inventada — nenhum nome, e-mail, CPF ou valor aqui
 * corresponde a pessoa real. Tudo é constante e determinístico: a demo é um
 * build estático, então nada pode depender da data em que a página é aberta
 * (o servidor e o browser renderizariam textos diferentes).
 */

export const SCHOOL = {
  name: "Escola D'Ávilla",
  academicYear: 2026,
  referenceMonthLabel: "Agosto de 2026",
  today: "2026-08-13",
} as const;

export type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

export const DEMO_USERS: Record<
  Role,
  { name: string; email: string; roleLabel: string; home: string }
> = {
  ADMIN: {
    name: "Helena Prado",
    email: "admin@davilla.demo",
    roleLabel: "Administração",
    home: "/admin/dashboard",
  },
  TEACHER: {
    name: "Marcos Vieira",
    email: "professor@davilla.demo",
    roleLabel: "Professor",
    home: "/teacher/dashboard",
  },
  PARENT: {
    name: "Cláudia Ramos",
    email: "responsavel@davilla.demo",
    roleLabel: "Responsável",
    home: "/parent/dashboard",
  },
  STUDENT: {
    name: "Beatriz Ramos",
    email: "aluno@davilla.demo",
    roleLabel: "Aluno",
    home: "/student/dashboard",
  },
};

/* ------------------------------------------------------------------ admin */

export const ADMIN_STATS = {
  students: 248,
  teachers: 18,
  classes: 12,
  monthlyRevenue: 187_420.0,
  pendingEnrollments: 4,
};

export type ClassRow = {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  homeroomTeacher: string;
  students: number;
  capacity: number;
  room: string;
  shift: "Manhã" | "Tarde";
};

export const CLASSES: ClassRow[] = [
  {
    id: "c1",
    name: "1º Ano A",
    gradeLevel: "1º ano",
    section: "A",
    homeroomTeacher: "Sônia Albuquerque",
    students: 22,
    capacity: 25,
    room: "Sala 1",
    shift: "Manhã",
  },
  {
    id: "c2",
    name: "2º Ano A",
    gradeLevel: "2º ano",
    section: "A",
    homeroomTeacher: "Rita Camargo",
    students: 24,
    capacity: 25,
    room: "Sala 2",
    shift: "Manhã",
  },
  {
    id: "c3",
    name: "3º Ano A",
    gradeLevel: "3º ano",
    section: "A",
    homeroomTeacher: "Paulo Bittencourt",
    students: 21,
    capacity: 25,
    room: "Sala 3",
    shift: "Manhã",
  },
  {
    id: "c4",
    name: "5º Ano B",
    gradeLevel: "5º ano",
    section: "B",
    homeroomTeacher: "Marcos Vieira",
    students: 23,
    capacity: 26,
    room: "Sala 7",
    shift: "Tarde",
  },
  {
    id: "c5",
    name: "6º Ano A",
    gradeLevel: "6º ano",
    section: "A",
    homeroomTeacher: "Marcos Vieira",
    students: 26,
    capacity: 28,
    room: "Sala 8",
    shift: "Tarde",
  },
  {
    id: "c6",
    name: "7º Ano A",
    gradeLevel: "7º ano",
    section: "A",
    homeroomTeacher: "Denise Fontoura",
    students: 25,
    capacity: 28,
    room: "Sala 9",
    shift: "Tarde",
  },
  {
    id: "c7",
    name: "8º Ano A",
    gradeLevel: "8º ano",
    section: "A",
    homeroomTeacher: "Rodrigo Sales",
    students: 27,
    capacity: 28,
    room: "Sala 10",
    shift: "Tarde",
  },
  {
    id: "c8",
    name: "9º Ano A",
    gradeLevel: "9º ano",
    section: "A",
    homeroomTeacher: "Ana Lúcia Ferraz",
    students: 24,
    capacity: 28,
    room: "Sala 11",
    shift: "Tarde",
  },
];

export type StudentRow = {
  id: string;
  registration: string;
  name: string;
  className: string;
  guardian: string;
  guardianPhone: string;
  status: "Ativo" | "Transferido" | "Inativo";
  enrolledAt: string;
};

export const STUDENTS: StudentRow[] = [
  {
    id: "s1",
    registration: "2026-0001",
    name: "Beatriz Ramos",
    className: "6º Ano A",
    guardian: "Cláudia Ramos",
    guardianPhone: "(84) 99632-0114",
    status: "Ativo",
    enrolledAt: "2026-01-22",
  },
  {
    id: "s2",
    registration: "2026-0002",
    name: "Caio Ramos",
    className: "3º Ano A",
    guardian: "Cláudia Ramos",
    guardianPhone: "(84) 99632-0114",
    status: "Ativo",
    enrolledAt: "2026-01-22",
  },
  {
    id: "s3",
    registration: "2026-0003",
    name: "Antônio Lins",
    className: "6º Ano A",
    guardian: "Marcelo Lins",
    guardianPhone: "(84) 99118-7702",
    status: "Ativo",
    enrolledAt: "2026-01-19",
  },
  {
    id: "s4",
    registration: "2026-0004",
    name: "Helena Tavares",
    className: "6º Ano A",
    guardian: "Juliana Tavares",
    guardianPhone: "(84) 98844-3390",
    status: "Ativo",
    enrolledAt: "2026-01-19",
  },
  {
    id: "s5",
    registration: "2026-0005",
    name: "Davi Nogueira",
    className: "6º Ano A",
    guardian: "Fernando Nogueira",
    guardianPhone: "(84) 99771-5521",
    status: "Ativo",
    enrolledAt: "2026-01-20",
  },
  {
    id: "s6",
    registration: "2026-0006",
    name: "Lorena Sampaio",
    className: "6º Ano A",
    guardian: "Patrícia Sampaio",
    guardianPhone: "(84) 99405-8863",
    status: "Ativo",
    enrolledAt: "2026-01-20",
  },
  {
    id: "s7",
    registration: "2026-0007",
    name: "Rafael Bezerra",
    className: "5º Ano B",
    guardian: "Sílvia Bezerra",
    guardianPhone: "(84) 98120-6647",
    status: "Ativo",
    enrolledAt: "2026-01-21",
  },
  {
    id: "s8",
    registration: "2026-0008",
    name: "Manuela Cavalcanti",
    className: "5º Ano B",
    guardian: "Ricardo Cavalcanti",
    guardianPhone: "(84) 99230-1174",
    status: "Ativo",
    enrolledAt: "2026-01-21",
  },
  {
    id: "s9",
    registration: "2026-0009",
    name: "Théo Almeida",
    className: "9º Ano A",
    guardian: "Renata Almeida",
    guardianPhone: "(84) 99688-2039",
    status: "Ativo",
    enrolledAt: "2026-01-15",
  },
  {
    id: "s10",
    registration: "2026-0010",
    name: "Isabela Moura",
    className: "9º Ano A",
    guardian: "Gustavo Moura",
    guardianPhone: "(84) 99012-4488",
    status: "Ativo",
    enrolledAt: "2026-01-15",
  },
  {
    id: "s11",
    registration: "2025-0148",
    name: "Pedro Henrique Dias",
    className: "8º Ano A",
    guardian: "Marta Dias",
    guardianPhone: "(84) 99537-7781",
    status: "Transferido",
    enrolledAt: "2025-02-03",
  },
  {
    id: "s12",
    registration: "2026-0011",
    name: "Sofia Vasconcelos",
    className: "1º Ano A",
    guardian: "Bruno Vasconcelos",
    guardianPhone: "(84) 98801-9925",
    status: "Ativo",
    enrolledAt: "2026-01-26",
  },
];

/* -------------------------------------------------------------- financeiro */

export const FINANCIAL_SUMMARY = {
  receivable: { total: 214_800.0, count: 248 },
  paid: { total: 187_420.0, count: 216 },
  pending: { total: 19_760.0, count: 22 },
  overdue: { total: 7_620.0, count: 10 },
  draftBillings: { count: 12, total: 10_680.0 },
  payroll: { gross: 96_400.0, net: 78_930.0, employees: 26 },
};

export type BillingStatus = "PAID" | "PENDING" | "OVERDUE" | "DRAFT";

export type BillingRow = {
  id: string;
  invoice: string;
  student: string;
  guardian: string;
  description: string;
  dueDate: string;
  amount: number;
  status: BillingStatus;
  daysLate?: number;
  fine?: number;
  interest?: number;
};

export const BILLINGS: BillingRow[] = [
  {
    id: "b1",
    invoice: "2026/08-0001",
    student: "Beatriz Ramos",
    guardian: "Cláudia Ramos",
    description: "Mensalidade — agosto",
    dueDate: "2026-08-10",
    amount: 890.0,
    status: "PENDING",
  },
  {
    id: "b2",
    invoice: "2026/08-0002",
    student: "Caio Ramos",
    guardian: "Cláudia Ramos",
    description: "Mensalidade — agosto",
    dueDate: "2026-08-10",
    amount: 760.0,
    status: "PAID",
  },
  {
    id: "b3",
    invoice: "2026/07-0044",
    student: "Antônio Lins",
    guardian: "Marcelo Lins",
    description: "Mensalidade — julho",
    dueDate: "2026-07-10",
    amount: 890.0,
    status: "OVERDUE",
    daysLate: 34,
    fine: 17.8,
    interest: 10.08,
  },
  {
    id: "b4",
    invoice: "2026/08-0003",
    student: "Helena Tavares",
    guardian: "Juliana Tavares",
    description: "Mensalidade — agosto",
    dueDate: "2026-08-10",
    amount: 890.0,
    status: "PAID",
  },
  {
    id: "b5",
    invoice: "2026/08-0004",
    student: "Davi Nogueira",
    guardian: "Fernando Nogueira",
    description: "Mensalidade — agosto",
    dueDate: "2026-08-10",
    amount: 890.0,
    status: "PAID",
  },
  {
    id: "b6",
    invoice: "2026/08-0005",
    student: "Lorena Sampaio",
    guardian: "Patrícia Sampaio",
    description: "Mensalidade + material — agosto",
    dueDate: "2026-08-10",
    amount: 1_040.0,
    status: "PENDING",
  },
  {
    id: "b7",
    invoice: "2026/07-0051",
    student: "Rafael Bezerra",
    guardian: "Sílvia Bezerra",
    description: "Mensalidade — julho",
    dueDate: "2026-07-10",
    amount: 820.0,
    status: "OVERDUE",
    daysLate: 34,
    fine: 16.4,
    interest: 9.29,
  },
  {
    id: "b8",
    invoice: "2026/08-0006",
    student: "Manuela Cavalcanti",
    guardian: "Ricardo Cavalcanti",
    description: "Mensalidade — agosto",
    dueDate: "2026-08-10",
    amount: 820.0,
    status: "PAID",
  },
  {
    // Atrasada e da mesma responsável das duas primeiras: é ela que mostra a
    // multa e os juros no portal do responsável.
    id: "b11",
    invoice: "2026/07-0031",
    student: "Beatriz Ramos",
    guardian: "Cláudia Ramos",
    description: "Mensalidade — julho",
    dueDate: "2026-07-10",
    amount: 890.0,
    status: "OVERDUE",
    daysLate: 34,
    fine: 17.8,
    interest: 10.08,
  },
  {
    id: "b9",
    invoice: "2026/09-0007",
    student: "Théo Almeida",
    guardian: "Renata Almeida",
    description: "Mensalidade — setembro",
    dueDate: "2026-09-10",
    amount: 940.0,
    status: "DRAFT",
  },
  {
    id: "b10",
    invoice: "2026/09-0008",
    student: "Isabela Moura",
    guardian: "Gustavo Moura",
    description: "Mensalidade — setembro",
    dueDate: "2026-09-10",
    amount: 940.0,
    status: "DRAFT",
  },
];

export const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
  DRAFT: "Aguardando aprovação",
};

/* ------------------------------------------------------ matrículas online */

export type EnrollmentRequest = {
  id: string;
  protocol: string;
  student: string;
  gradeLevel: string;
  guardian: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documents: number;
  documentsExpected: number;
};

export const ENROLLMENT_REQUESTS: EnrollmentRequest[] = [
  {
    id: "e1",
    protocol: "MAT-2026-0112",
    student: "Laura Beserra",
    gradeLevel: "1º ano",
    guardian: "Eduarda Beserra",
    submittedAt: "2026-08-11",
    status: "PENDING",
    documents: 4,
    documentsExpected: 4,
  },
  {
    id: "e2",
    protocol: "MAT-2026-0113",
    student: "Miguel Fontes",
    gradeLevel: "4º ano",
    guardian: "Alexandre Fontes",
    submittedAt: "2026-08-11",
    status: "PENDING",
    documents: 3,
    documentsExpected: 4,
  },
  {
    id: "e3",
    protocol: "MAT-2026-0114",
    student: "Cecília Andrade",
    gradeLevel: "2º ano",
    guardian: "Vanessa Andrade",
    submittedAt: "2026-08-12",
    status: "PENDING",
    documents: 4,
    documentsExpected: 4,
  },
  {
    id: "e4",
    protocol: "MAT-2026-0115",
    student: "Arthur Peixoto",
    gradeLevel: "7º ano",
    guardian: "Leandro Peixoto",
    submittedAt: "2026-08-12",
    status: "PENDING",
    documents: 2,
    documentsExpected: 4,
  },
  {
    id: "e5",
    protocol: "MAT-2026-0109",
    student: "Yasmin Correia",
    gradeLevel: "6º ano",
    guardian: "Tatiana Correia",
    submittedAt: "2026-08-06",
    status: "APPROVED",
    documents: 4,
    documentsExpected: 4,
  },
  {
    id: "e6",
    protocol: "MAT-2026-0104",
    student: "Enzo Guimarães",
    gradeLevel: "3º ano",
    guardian: "Roberta Guimarães",
    submittedAt: "2026-07-30",
    status: "REJECTED",
    documents: 1,
    documentsExpected: 4,
  },
];

/* ---------------------------------------------------------------- avisos */

export const ANNOUNCEMENTS = [
  {
    id: "a1",
    title: "Reunião de pais — 3º bimestre",
    audience: "Todas as turmas",
    publishedAt: "2026-08-10",
  },
  {
    id: "a2",
    title: "Feira de ciências: entrega dos projetos",
    audience: "6º ao 9º ano",
    publishedAt: "2026-08-07",
  },
  {
    id: "a3",
    title: "Semana de provas do 3º bimestre",
    audience: "Todas as turmas",
    publishedAt: "2026-08-03",
  },
];

/* ------------------------------------------------------------- professor */

export type TeacherClass = {
  id: string;
  name: string;
  subject: string;
  students: number;
  nextLesson: string;
  pendingGrades: number;
};

export const TEACHER_CLASSES: TeacherClass[] = [
  {
    id: "c5",
    name: "6º Ano A",
    subject: "Matemática",
    students: 26,
    nextLesson: "Seg, 13h30",
    pendingGrades: 0,
  },
  {
    id: "c4",
    name: "5º Ano B",
    subject: "Matemática",
    students: 23,
    nextLesson: "Seg, 15h20",
    pendingGrades: 5,
  },
  {
    id: "c6",
    name: "7º Ano A",
    subject: "Matemática",
    students: 25,
    nextLesson: "Ter, 13h30",
    pendingGrades: 0,
  },
];

/** Alunos do 6º Ano A — usados no diário de notas e na chamada. */
export const CLASS_ROSTER = [
  { id: "r1", number: 1, name: "Antônio Lins" },
  { id: "r2", number: 2, name: "Beatriz Ramos" },
  { id: "r3", number: 3, name: "Davi Nogueira" },
  { id: "r4", number: 4, name: "Helena Tavares" },
  { id: "r5", number: 5, name: "Lorena Sampaio" },
  { id: "r6", number: 6, name: "Otávio Meireles" },
  { id: "r7", number: 7, name: "Valentina Rocha" },
  { id: "r8", number: 8, name: "Yasmin Correia" },
];

/** Notas já lançadas do bimestre (0 a 10), por aluno do roster. */
export const GRADEBOOK: Record<string, { prova1: number; trabalho: number }> = {
  r1: { prova1: 7.5, trabalho: 8.0 },
  r2: { prova1: 9.0, trabalho: 9.5 },
  r3: { prova1: 6.0, trabalho: 7.0 },
  r4: { prova1: 8.5, trabalho: 8.0 },
  r5: { prova1: 9.5, trabalho: 10.0 },
  r6: { prova1: 5.5, trabalho: 6.5 },
  r7: { prova1: 8.0, trabalho: 7.5 },
  r8: { prova1: 7.0, trabalho: 8.5 },
};

/* ------------------------------------------------------------ responsável */

export const PARENT_CHILDREN = [
  {
    id: "s1",
    name: "Beatriz Ramos",
    className: "6º Ano A",
    homeroomTeacher: "Marcos Vieira",
    average: 8.6,
    attendance: 96.4,
    reportHref: "/parent/report",
  },
  {
    id: "s2",
    name: "Caio Ramos",
    className: "3º Ano A",
    homeroomTeacher: "Paulo Bittencourt",
    average: 9.1,
    attendance: 98.2,
    reportHref: "/parent/report",
  },
];

export const PARENT_BILLINGS = BILLINGS.filter(
  (billing) => billing.guardian === "Cláudia Ramos"
);

export const PARENT_SUMMARY = {
  children: PARENT_CHILDREN.length,
  openBillings: PARENT_BILLINGS.filter((b) => b.status !== "PAID").length,
  totalDue: PARENT_BILLINGS.filter((b) => b.status !== "PAID").reduce(
    (total, b) => total + b.amount + (b.fine ?? 0) + (b.interest ?? 0),
    0
  ),
};

/* ------------------------------------------------------------------ aluno */

export type SubjectReport = {
  subject: string;
  teacher: string;
  bimester1: number;
  bimester2: number;
  bimester3: number | null;
  absences: number;
};

export const REPORT_CARD: SubjectReport[] = [
  {
    subject: "Língua Portuguesa",
    teacher: "Ana Lúcia Ferraz",
    bimester1: 8.5,
    bimester2: 9.0,
    bimester3: null,
    absences: 2,
  },
  {
    subject: "Matemática",
    teacher: "Marcos Vieira",
    bimester1: 9.0,
    bimester2: 8.5,
    bimester3: null,
    absences: 1,
  },
  {
    subject: "Ciências",
    teacher: "Denise Fontoura",
    bimester1: 8.0,
    bimester2: 8.8,
    bimester3: null,
    absences: 3,
  },
  {
    subject: "História",
    teacher: "Rodrigo Sales",
    bimester1: 9.5,
    bimester2: 9.0,
    bimester3: null,
    absences: 0,
  },
  {
    subject: "Geografia",
    teacher: "Rodrigo Sales",
    bimester1: 7.5,
    bimester2: 8.0,
    bimester3: null,
    absences: 2,
  },
  {
    subject: "Inglês",
    teacher: "Sônia Albuquerque",
    bimester1: 9.0,
    bimester2: 9.5,
    bimester3: null,
    absences: 1,
  },
  {
    subject: "Arte",
    teacher: "Rita Camargo",
    bimester1: 10.0,
    bimester2: 9.5,
    bimester3: null,
    absences: 0,
  },
  {
    subject: "Educação Física",
    teacher: "Paulo Bittencourt",
    bimester1: 9.0,
    bimester2: 9.0,
    bimester3: null,
    absences: 4,
  },
];

export const STUDENT_SUMMARY = {
  className: "6º Ano A",
  classSize: 26,
  average: 8.9,
  attendance: 96.4,
  presentLessons: 134,
  totalLessons: 139,
  assessments: 16,
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  LATE: "Atraso",
  EXCUSED: "Falta justificada",
};

export const STUDENT_ATTENDANCE: {
  date: string;
  subject: string;
  status: AttendanceStatus;
}[] = [
  { date: "2026-08-12", subject: "Matemática", status: "PRESENT" },
  { date: "2026-08-12", subject: "História", status: "PRESENT" },
  { date: "2026-08-11", subject: "Ciências", status: "LATE" },
  { date: "2026-08-11", subject: "Língua Portuguesa", status: "PRESENT" },
  { date: "2026-08-10", subject: "Matemática", status: "PRESENT" },
  { date: "2026-08-07", subject: "Geografia", status: "EXCUSED" },
  { date: "2026-08-07", subject: "Inglês", status: "PRESENT" },
  { date: "2026-08-06", subject: "Educação Física", status: "ABSENT" },
];

export const STUDENT_ASSESSMENTS = [
  {
    id: "as1",
    subject: "Matemática",
    type: "Prova",
    date: "2026-08-05",
    score: 9.0,
    maxScore: 10,
  },
  {
    id: "as2",
    subject: "História",
    type: "Trabalho",
    date: "2026-08-04",
    score: 9.5,
    maxScore: 10,
  },
  {
    id: "as3",
    subject: "Ciências",
    type: "Prova",
    date: "2026-07-29",
    score: 8.8,
    maxScore: 10,
  },
  {
    id: "as4",
    subject: "Língua Portuguesa",
    type: "Redação",
    date: "2026-07-24",
    score: 9.0,
    maxScore: 10,
  },
  {
    id: "as5",
    subject: "Inglês",
    type: "Prova",
    date: "2026-07-22",
    score: 9.5,
    maxScore: 10,
  },
];
