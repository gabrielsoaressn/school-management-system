# 📋 PROPOSTA DE SCHEMA - MÓDULOS AVANÇADOS

## 🎯 RESUMO DAS MUDANÇAS

### ✅ O que já temos e pode ser reaproveitado:

- **User, Student, Parent, Employee, Teacher** → Base de usuários OK
- **Grade, Attendance** → Notas e presença (precisa melhorias)
- **Billing, Tuition, Payroll** → Financeiro básico (precisa expansão)
- **Announcement, Notification** → Comunicação básica (OK para Módulo 4)
- **AcademicReport** → Boletim (OK)

### 🆕 Novas tabelas necessárias:

#### MÓDULO 1: MATRÍCULA DIGITAL

1. **EnrollmentRequest** - Solicitações de matrícula pendentes
2. **GuardianRelationship** - Relacionamento entre aluno e responsáveis (financeiro + pedagógico)

#### MÓDULO 2: GESTÃO ACADÊMICA

3. **AssessmentType** - Tipos de avaliação (prova, trabalho, participação)
4. **Assessment** - Avaliações individuais (substitui/complementa Grade)
5. **AttendanceRecord** - Melhorar Attendance com classId e subjectId

#### MÓDULO 3: FINANCEIRO AVANÇADO

6. **PaymentReminder** - Histórico de lembretes enviados
7. **PaymentRenegotiation** - Renegociações de dívidas
8. **FinancialContact** - Contatos para cobrança (email, WhatsApp)

#### MÓDULO 4: PORTAL DE COMUNICAÇÃO

9. **Occurrence** - Ocorrências pedagógicas
10. **CommunicationThread** - Thread de mensagens (opcional, pode usar Notification)

#### MÓDULO 5: GERADOR DE DOCUMENTOS

11. **DocumentTemplate** - Templates de documentos
12. **GeneratedDocument** - Histórico de documentos gerados

---

## 📝 SCHEMA COMPLETO PROPOSTO

```prisma
// ============================================
// 🆕 NOVOS ENUMS
// ============================================

enum EnrollmentRequestStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  CANCELLED
}

enum GuardianType {
  FINANCIAL        // Responsável Financeiro
  PEDAGOGICAL      // Responsável Pedagógico
  BOTH            // Ambos
}

enum ReminderType {
  EMAIL
  WHATSAPP
  SMS
  SYSTEM
}

enum ReminderStatus {
  SENT
  DELIVERED
  FAILED
  OPENED
}

enum OccurrenceType {
  BEHAVIORAL      // Comportamento
  ACADEMIC        // Acadêmico
  HEALTH         // Saúde
  ATTENDANCE     // Frequência
  POSITIVE       // Elogio/Reconhecimento
  OTHER
}

enum OccurrenceSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DocumentType {
  ENROLLMENT_DECLARATION    // Declaração de Matrícula
  SERVICE_CONTRACT         // Contrato de Prestação de Serviços
  ACADEMIC_TRANSCRIPT      // Histórico Escolar
  CONDUCT_CERTIFICATE      // Atestado de Conduta
  ENROLLMENT_CERTIFICATE   // Certificado de Matrícula
  CUSTOM                   // Personalizado
}

// ============================================
// 🔄 ENUMS ATUALIZADOS
// ============================================

// Adicionar RENEGOTIATED ao PaymentStatus existente
enum PaymentStatus {
  DRAFT
  PENDING
  PAID
  OVERDUE
  RENEGOTIATED    // 🆕 NOVO
  CANCELLED
}

// ============================================
// 🔄 MODELOS ATUALIZADOS
// ============================================

// Adicionar role TEACHER ao UserRole
enum UserRole {
  ADMIN
  PARENT
  STUDENT
  TEACHER        // 🆕 NOVO - para login do professor
}

// ============================================
// 🆕 MÓDULO 1: MATRÍCULA DIGITAL
// ============================================

model EnrollmentRequest {
  id               String                   @id @default(cuid())
  requestNumber    String                   @unique // Ex: ENR-2024-0001
  status           EnrollmentRequestStatus  @default(PENDING)

  // Dados do Aluno
  studentFirstName String
  studentLastName  String
  dateOfBirth      DateTime
  gender           Gender
  gradeLevel       String
  section          String?

  // Dados do Responsável Financeiro
  financialGuardianFirstName String
  financialGuardianLastName  String
  financialGuardianCPF       String
  financialGuardianPhone     String
  financialGuardianEmail     String

  // Dados do Responsável Pedagógico (pode ser o mesmo)
  pedagogicalGuardianFirstName String?
  pedagogicalGuardianLastName  String?
  pedagogicalGuardianCPF       String?
  pedagogicalGuardianPhone     String?
  pedagogicalGuardianEmail     String?
  isSameGuardian               Boolean    @default(false) // Mesmo responsável para ambos?

  // Endereço
  address          String
  city             String
  state            String
  zipCode          String

  // Documentos anexos (URLs)
  birthCertificateUrl  String?
  cpfUrl               String?
  proofOfAddressUrl    String?
  previousSchoolUrl    String?

  // Campos administrativos
  reviewedBy       String?      // ID do admin que revisou
  reviewedAt       DateTime?
  rejectionReason  String?
  notes            String?

  // Relacionamento com aluno criado (após aprovação)
  approvedStudentId String?     @unique
  approvedStudent   Student?    @relation(fields: [approvedStudentId], references: [id])

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([status])
  @@index([requestNumber])
  @@index([createdAt])
}

model GuardianRelationship {
  id            String       @id @default(cuid())
  studentId     String
  student       Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  parentId      String
  parent        Parent       @relation(fields: [parentId], references: [id], onDelete: Cascade)

  guardianType  GuardianType
  isPrimary     Boolean      @default(false) // Responsável principal?
  canPickup     Boolean      @default(true)  // Autorizado a buscar?

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([studentId, parentId, guardianType])
  @@index([studentId])
  @@index([parentId])
}

// ============================================
// 🆕 MÓDULO 2: GESTÃO ACADÊMICA (Diário de Classe)
// ============================================

model AssessmentType {
  id           String  @id @default(cuid())
  name         String  // Ex: "Prova Bimestral", "Trabalho em Grupo"
  code         String  @unique // Ex: "P1", "T1", "PART"
  weight       Float   @default(1.0) // Peso na média (0.0 a 1.0)
  maxScore     Float   @default(10.0)
  description  String?

  // Relacionamento
  assessments  Assessment[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([code])
}

model Assessment {
  id              String         @id @default(cuid())
  studentId       String
  student         Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)

  subjectId       String
  subject         Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  classId         String
  class           Class          @relation(fields: [classId], references: [id], onDelete: Cascade)

  teacherId       String?
  teacher         Teacher?       @relation(fields: [teacherId], references: [id])

  assessmentTypeId String
  assessmentType  AssessmentType @relation(fields: [assessmentTypeId], references: [id])

  term            String         // Ex: "1º Bimestre", "2º Trimestre"
  academicYear    String
  score           Float
  maxScore        Float          @default(10.0)
  grade           String?        // A, B, C, etc. (calculado)
  remarks         String?
  assessmentDate  DateTime       @default(now())

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([studentId, subjectId, assessmentTypeId, term, academicYear])
  @@index([studentId])
  @@index([subjectId])
  @@index([classId])
  @@index([teacherId])
  @@index([term, academicYear])
}

model AttendanceRecord {
  id        String           @id @default(cuid())
  studentId String
  student   Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)

  classId   String
  class     Class            @relation(fields: [classId], references: [id], onDelete: Cascade)

  subjectId String?
  subject   Subject?         @relation(fields: [subjectId], references: [id])

  teacherId String?
  teacher   Teacher?         @relation(fields: [teacherId], references: [id])

  date      DateTime
  status    AttendanceStatus
  remarks   String?

  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([studentId, classId, date])
  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([date])
}

// ============================================
// 🆕 MÓDULO 3: FINANCEIRO AVANÇADO (Régua de Cobrança)
// ============================================

model PaymentReminder {
  id            String         @id @default(cuid())
  billingId     String
  billing       Billing        @relation(fields: [billingId], references: [id], onDelete: Cascade)

  reminderType  ReminderType
  status        ReminderStatus @default(SENT)

  recipientName  String
  recipientEmail String?
  recipientPhone String?

  subject       String?        // Assunto do e-mail
  message       String         // Conteúdo da mensagem
  templateUsed  String?        // Nome do template usado

  sentAt        DateTime       @default(now())
  deliveredAt   DateTime?
  openedAt      DateTime?
  clickedAt     DateTime?

  errorMessage  String?        // Se falhou, motivo do erro

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([billingId])
  @@index([status])
  @@index([sentAt])
}

model PaymentRenegotiation {
  id               String    @id @default(cuid())
  billingId        String
  billing          Billing   @relation(fields: [billingId], references: [id], onDelete: Cascade)

  originalAmount   Float
  renegotiatedAmount Float
  discount         Float     @default(0)
  installments     Int       @default(1)

  newDueDate       DateTime
  renegotiatedBy   String    // Admin ID
  parentApprovedAt DateTime?

  reason           String?
  notes            String?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([billingId])
  @@index([createdAt])
}

model FinancialContact {
  id            String   @id @default(cuid())
  parentId      String
  parent        Parent   @relation(fields: [parentId], references: [id], onDelete: Cascade)

  contactType   String   // PRIMARY, SECONDARY, EMERGENCY
  name          String
  email         String?
  phoneNumber   String
  whatsappNumber String?
  preferredMethod String @default("EMAIL") // EMAIL, WHATSAPP, SMS

  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([parentId])
  @@index([contactType])
}

// ============================================
// 🆕 MÓDULO 4: PORTAL DE COMUNICAÇÃO (Agenda Virtual)
// ============================================

model Occurrence {
  id              String             @id @default(cuid())
  studentId       String
  student         Student            @relation(fields: [studentId], references: [id], onDelete: Cascade)

  type            OccurrenceType
  severity        OccurrenceSeverity
  title           String
  description     String

  reportedBy      String             // ID do professor/admin
  reportedByName  String             // Nome para exibição

  date            DateTime           @default(now())
  actionTaken     String?            // Ação tomada

  // Notificação aos pais
  parentNotified  Boolean            @default(false)
  parentViewedAt  DateTime?
  parentComments  String?

  attachmentUrl   String?

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([studentId])
  @@index([type])
  @@index([severity])
  @@index([date])
}

model CommunicationThread {
  id            String    @id @default(cuid())
  subject       String

  senderId      String
  senderName    String
  senderRole    String    // ADMIN, TEACHER, PARENT

  recipientId   String
  recipientName String
  recipientRole String

  lastMessageAt DateTime  @default(now())
  isArchived    Boolean   @default(false)

  messages      Message[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([senderId])
  @@index([recipientId])
  @@index([lastMessageAt])
}

model Message {
  id        String              @id @default(cuid())
  threadId  String
  thread    CommunicationThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  senderId  String
  senderName String

  content   String
  isRead    Boolean             @default(false)
  readAt    DateTime?

  attachmentUrl String?

  createdAt DateTime            @default(now())

  @@index([threadId])
  @@index([senderId])
  @@index([createdAt])
}

// ============================================
// 🆕 MÓDULO 5: GERADOR DE DOCUMENTOS
// ============================================

model DocumentTemplate {
  id          String       @id @default(cuid())
  name        String
  type        DocumentType
  description String?

  // Template em HTML com placeholders
  // Ex: {{student.fullName}}, {{parent.cpf}}, {{tuition.amount}}
  htmlTemplate String

  // Variáveis disponíveis (JSON)
  // Ex: ["student.fullName", "student.studentId", "parent.cpf", etc.]
  availableVariables String

  isActive    Boolean      @default(true)

  // Relacionamento
  generatedDocuments GeneratedDocument[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([type])
}

model GeneratedDocument {
  id         String           @id @default(cuid())

  templateId String
  template   DocumentTemplate @relation(fields: [templateId], references: [id])

  studentId  String
  student    Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)

  type       DocumentType

  // HTML gerado (com dados injetados)
  generatedHtml String

  // URL do PDF gerado (se salvou)
  pdfUrl     String?

  generatedBy String          // Admin ID
  generatedAt DateTime        @default(now())

  // Metadados (JSON)
  // Ex: { "purpose": "Transferência", "requestedBy": "Maria Silva" }
  metadata   String?

  createdAt  DateTime         @default(now())

  @@index([studentId])
  @@index([type])
  @@index([generatedAt])
}

// ============================================
// 🔄 ATUALIZAÇÕES NOS MODELOS EXISTENTES
// ============================================

// Student - adicionar relacionamento com EnrollmentRequest
model Student {
  // ... campos existentes ...

  // 🆕 Novos relacionamentos
  enrollmentRequest  EnrollmentRequest?
  guardianRelationships GuardianRelationship[]
  assessments        Assessment[]
  attendanceRecords  AttendanceRecord[]
  occurrences        Occurrence[]
  generatedDocuments GeneratedDocument[]
}

// Parent - adicionar WhatsApp
model Parent {
  // ... campos existentes ...

  // 🆕 Novo campo
  whatsappNumber String?

  // 🆕 Novos relacionamentos
  guardianRelationships GuardianRelationship[]
  financialContacts     FinancialContact[]
}

// Billing - adicionar relacionamentos
model Billing {
  // ... campos existentes ...

  // 🆕 Novos relacionamentos
  reminders       PaymentReminder[]
  renegotiations  PaymentRenegotiation[]
}

// Subject - adicionar relacionamentos
model Subject {
  // ... campos existentes ...

  // 🆕 Novos relacionamentos
  assessments      Assessment[]
  attendanceRecords AttendanceRecord[]
}

// Class - adicionar relacionamentos
model Class {
  // ... campos existentes ...

  // 🆕 Novos relacionamentos
  assessments       Assessment[]
  attendanceRecords AttendanceRecord[]
}

// Teacher - adicionar relacionamentos
model Teacher {
  // ... campos existentes ...

  // 🆕 Novos relacionamentos
  assessments       Assessment[]
  attendanceRecords AttendanceRecord[]
}

// User - adicionar role TEACHER
model User {
  // ... campos existentes ...

  // 🔄 Atualizar enum UserRole para incluir TEACHER
  role UserRole // ADMIN, PARENT, STUDENT, TEACHER
}
```

---

## 📊 RESUMO DE IMPACTO

### 🆕 Novas Tabelas: 12

1. EnrollmentRequest
2. GuardianRelationship
3. AssessmentType
4. Assessment
5. AttendanceRecord
6. PaymentReminder
7. PaymentRenegotiation
8. FinancialContact
9. Occurrence
10. CommunicationThread
11. Message
12. DocumentTemplate
13. GeneratedDocument

### 🔄 Tabelas Modificadas: 7

- User (adicionar role TEACHER)
- Student (novos relacionamentos)
- Parent (whatsappNumber + relacionamentos)
- Billing (novos relacionamentos)
- Subject (novos relacionamentos)
- Class (novos relacionamentos)
- Teacher (novos relacionamentos)

### 🆕 Novos Enums: 6

- EnrollmentRequestStatus
- GuardianType
- ReminderType, ReminderStatus
- OccurrenceType, OccurrenceSeverity
- DocumentType

### 🔄 Enums Modificados: 2

- PaymentStatus (adicionar RENEGOTIATED)
- UserRole (adicionar TEACHER)

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. Migração de Dados Existentes

- **Attendance → AttendanceRecord**: Precisaremos migrar os dados existentes da tabela `Attendance` para `AttendanceRecord` (com novos campos `classId` e `subjectId`)
- **Grade → Assessment**: Podemos manter ambas por enquanto ou migrar. Recomendo manter `Grade` para compatibilidade e usar `Assessment` para novas funcionalidades.

### 2. Índices para Performance

- Todos os relacionamentos têm `@@index` para queries rápidas
- Campos de busca frequente (status, datas) estão indexados

### 3. Cascata de Exclusão

- Relacionamentos críticos usam `onDelete: Cascade` para manter integridade
- Relacionamentos opcionais (teacherId?) são nullable

### 4. Campos de Auditoria

- Todas as tabelas têm `createdAt` e `updatedAt`
- Tabelas críticas têm `createdBy` / `reviewedBy` para rastreabilidade

---

## ✅ PRÓXIMOS PASSOS

Aguardando sua aprovação para:

1. ✅ Criar o arquivo de migração Prisma
2. ✅ Executar `prisma migrate dev`
3. ✅ Atualizar o seed.ts com dados de teste
4. 🚀 Iniciar desenvolvimento do **Módulo 1: Matrícula Digital**
