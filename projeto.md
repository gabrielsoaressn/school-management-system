# D'Ávilla — Sistema de Gestão Escolar

Documento de descrição técnica do projeto. Reflete o estado real do código em `2026-08-11`
(último commit: `5c9571a feat: initial commit - D'Ávilla School Management System`, branch `master`).

---

## 1. Visão geral

Aplicação web de gestão escolar voltada ao contexto brasileiro (idioma pt-BR, CPF/CNPJ, PIX,
séries "1º Ano" a "9º Ano", valores em Real). É um monólito Next.js que concentra em uma única
base de código quatro portais distintos, separados por perfil de usuário:

| Portal        | Rota base  | Público                                  |
| ------------- | ---------- | ---------------------------------------- |
| Administração | `/admin`   | secretaria, direção, financeiro          |
| Professor     | `/teacher` | lançamento de notas e chamada            |
| Responsável   | `/parent`  | acompanhamento dos filhos e mensalidades |
| Aluno         | `/student` | notas, frequência, turma                 |

Existe ainda uma rota **pública** `/matricula`, um formulário de solicitação de matrícula online
que não exige login.

O núcleo funcional maduro do sistema é o **módulo financeiro administrativo** (cobranças,
folha de pagamento, inadimplência, cadastros). Os demais módulos — matrícula digital, diário de
classe, comunicação e geração de documentos — existem ponta a ponta (schema + API + tela), mas
em estado de protótipo funcional (ver §11).

### Números do repositório

- 37 models e 17 enums no Prisma (≈44 tabelas no PostgreSQL, incluindo as do NextAuth)
- 28 páginas (App Router) e 34 route handlers de API
- 15 componentes React compartilhados
- 99 arquivos `.ts`/`.tsx` em `src/`, ~16 mil linhas
- seed de 1.262 linhas que popula todos os módulos

---

## 2. Stack técnica

| Camada       | Tecnologia                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Framework    | Next.js 15.1 (App Router, Server Components)                            |
| Linguagem    | TypeScript 5.7 em modo `strict`                                         |
| UI           | React 19, Tailwind CSS 3.4, `lucide-react`, `react-hot-toast`           |
| Banco        | PostgreSQL                                                              |
| ORM          | Prisma 5.22 (`@prisma/client`, `prisma generate` no `postinstall`)      |
| Autenticação | NextAuth 4.24 (Credentials + JWT) + `@auth/prisma-adapter` + `bcryptjs` |
| Validação    | Zod (nas APIs dos módulos novos)                                        |
| Processo     | PM2 (`ecosystem.config.js`)                                             |

**Dependências declaradas mas ainda não usadas em `src/`:** `stripe` / `@stripe/stripe-js`
(pagamento online), `jspdf` / `jspdf-autotable` (PDF), `recharts` (gráficos),
`react-hook-form` / `@hookform/resolvers` (formulários — os forms atuais usam `useState` manual).
Isso indica intenção de roadmap, não funcionalidade existente.

Não há ESLint config, Prettier config nem framework de testes no repositório.

---

## 3. Estrutura de diretórios

```
school-management-system/
├── prisma/
│   ├── schema.prisma          # 37 models, 17 enums (fonte da verdade do domínio)
│   └── seed.ts                # popula todos os módulos com dados realistas
├── src/
│   ├── app/
│   │   ├── page.tsx           # redireciona por role
│   │   ├── layout.tsx         # fonte Inter + Toaster global
│   │   ├── globals.css        # tokens HSL do design system
│   │   ├── login/
│   │   ├── matricula/         # formulário público de matrícula (5 etapas)
│   │   ├── admin/             # portal administrativo
│   │   ├── teacher/           # diário de classe
│   │   ├── parent/            # portal do responsável
│   │   ├── student/           # portal do aluno
│   │   └── api/               # 34 route handlers REST
│   ├── components/
│   │   ├── ui/                # Button, Input, Select, Card, Badge, Table, ...
│   │   ├── layout/            # PageHeader, PageWrapper
│   │   ├── settings/          # SettingsForm
│   │   └── FloatingAddButton.tsx
│   ├── lib/                   # prisma, auth, utils, constants, settings, employee-types
│   ├── types/next-auth.d.ts   # tipagem da sessão (inclui role)
│   └── middleware.ts          # RBAC de borda
├── docs/plans/                # design docs + plano de execução (redesign de turmas)
├── setup.sh, run.sh, seed.sh, pm2.sh
├── ecosystem.config.js        # config PM2
└── *.md                       # documentação de arquitetura e design system
```

---

## 4. Arquitetura da aplicação

### Dois estilos de página convivendo

O código tem duas gerações de páginas, resultado de terem sido escritas em fases diferentes:

**Geração A — Server Components (`/admin/*` financeiro, dashboards de pai e aluno).**
A página é `async`, chama `getCurrentUser()`, valida a role, consulta o Prisma diretamente
(`Promise.all` de agregações) e renderiza HTML no servidor. As partes interativas são extraídas
em componentes-cliente irmãos (`BillingsTable.tsx`, `StudentForm.tsx`, `EmployeesTable.tsx`…),
que falam com as APIs via `fetch`. Não há chamada HTTP para buscar dados de leitura.

**Geração B — Client Components (`/teacher/*`, `/matricula`, `/admin/enrollment-requests`,
`/admin/financial/collection`, `/admin/communication/announcements`, `/admin/documents/[id]`).**
Marcadas com `'use client'`, usam `useSession()` do NextAuth, controlam a role via `useEffect` +
`router.push`, e carregam tudo por `fetch` nas APIs. Estilizam com classes Tailwind literais
(`text-gray-600`) em vez dos tokens semânticos do design system.

Essa divisão explica quase todas as inconsistências listadas em §11 — inclusive uma que **quebra
o build** (§11.1).

### API

Route handlers REST em `src/app/api`, agrupados por audiência:

- `api/admin/*` — exigem `role === "ADMIN"`
- `api/teacher/*` — aceitam `TEACHER` ou `ADMIN`
- `api/enrollment-requests` — POST público (formulário de matrícula)
- `api/auth/[...nextauth]` — NextAuth

Dois padrões de resposta coexistem: as rotas admin retornam `{ data, pagination, message }` e as
rotas dos módulos novos retornam `{ success, data, message, errors }`. Validação com Zod só
existe nas rotas dos módulos novos (9 arquivos); as rotas admin validam campo a campo com `if`.

Operações compostas (criar aluno + responsável + matrícula + cobrança; processar recorrência)
usam `prisma.$transaction`.

---

## 5. Autenticação e autorização

- **Provider:** Credentials (e-mail + senha). Senha em `bcrypt`, comparada em `authorize()`;
  conta com `isActive: false` é rejeitada; `lastLogin` é atualizado a cada login.
- **Sessão:** estratégia JWT, validade de 30 dias. `id`, `email` e `role` são injetados no token
  e refletidos em `session.user` (tipado em `src/types/next-auth.d.ts`).
- **Roles:** `ADMIN`, `TEACHER`, `PARENT`, `STUDENT` (enum `UserRole`).
- **Três camadas de proteção:**
  1. `src/middleware.ts` — `withAuth` exige token e casa prefixo de rota com role.
     Matcher: `/admin/:path*`, `/parent/:path*`, `/student/:path*`.
  2. Página — cada Server Component revalida `user.role` e faz `redirect("/login")`.
  3. API — cada handler revalida a role antes de tocar o banco.

**Lacunas reais:** o matcher do middleware **não cobre `/teacher`** (a proteção dessas páginas
depende apenas do `useEffect` no cliente), e `src/app/page.tsx` não trata a role `TEACHER` — um
professor que acessa `/` cai no `default` e é mandado para `/login` em vez de
`/teacher/dashboard`.

Cabeçalhos de segurança (`X-Frame-Options: DENY`, `X-Content-Type-Options`, `X-XSS-Protection`,
`Referrer-Policy`) são aplicados globalmente em `next.config.js`.

---

## 6. Modelo de dados

`prisma/schema.prisma` está organizado em blocos comentados. Visão por domínio:

### 6.1 Identidade e pessoas

- **`User`** — e-mail único, senha, `role`, `isActive`, `lastLogin`. Relação 1:1 opcional com
  `Student`, `Parent` ou `Employee`.
- **`Student`** — `studentId` (`EST0001`), dados pessoais, `gradeLevel` + `section`, `parentId`.
- **`Parent`** — dados de contato, `cpf` único, `whatsappNumber`.
- **`Employee`** — `employeeId`, `employeeType` (11 valores: professor, coordenador, psicólogo,
  diretor, limpeza, auxiliar de sala…), `salary`, dados bancários (`pixKey`, `bankAgency`…).
- **`Teacher`** — extensão 1:1 de `Employee` com `qualification`, `specialization`, `experience`.
- **`GuardianRelationship`** — permite múltiplos responsáveis por aluno, com `guardianType`
  (`FINANCIAL` / `PEDAGOGICAL` / `BOTH`), `isPrimary` e `canPickup`.

### 6.2 Estrutura acadêmica

- **`Subject`** — matéria por série, com `code` único e `creditHours`.
- **`TeacherSubject`** — N:N professor ↔ matéria.
- **`Class`** — turma física: `gradeLevel` + `section` + `academicYear` (único), `roomNumber`,
  `schedule`, `capacity`. **Não** tem matéria nem professor — resultado do redesign descrito em
  `docs/plans/2026-02-23-class-structure-redesign.md`, que reduziu ~270 registros de turma para
  ~27 ("uma turma é uma sala, não uma matéria").
- **`Enrollment`** — matrícula aluno ↔ turma (única por par). O aluno se matricula uma vez e
  herda todas as matérias da sua série.

### 6.3 Avaliação e frequência — duas gerações

| Legado (mantido)                 | Atual                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `Grade` (aluno+matéria+bimestre) | `Assessment` (+ turma, professor, `AssessmentType` com peso e nota máxima) |
| `Attendance` (aluno+data)        | `AttendanceRecord` (+ turma, matéria, professor)                           |

`AcademicReport` (boletim consolidado: GPA, % de frequência, comentários) existe no schema e é
alimentado pelo seed, mas **não tem tela nem API**.

### 6.4 Financeiro

- **`Billing`** — contas a receber ligadas ao **responsável**. `type` (`TUITION`, `MATERIAL`,
  `EVENT`, `OTHER`), `status`, `isRecurring` + `recurrence` + `nextBillingDate`.
- **`Tuition`** + **`TuitionPlan`** + **`Discount`** — mensalidade ligada ao **aluno**, modelo
  paralelo e mais antigo, ainda usado pelos dashboards de admin e de responsável.
- **`Payroll`** — folha por funcionário/mês/ano (único), com `baseSalary`, `bonus`, `deductions`,
  `status` (`SCHEDULED` / `COMPLETED` / `CANCELLED`).
- **`Expense`** — despesas por categoria.
- **`PaymentReminder`** — histórico da régua de cobrança: canal (`EMAIL`/`WHATSAPP`/`SMS`/
  `SYSTEM`), status (`SENT`/`DELIVERED`/`FAILED`/`OPENED`), timestamps de entrega/abertura/clique.
- **`PaymentRenegotiation`** — valor original vs. renegociado, desconto, parcelas, nova data.
- **`FinancialContact`** — contatos de cobrança adicionais por responsável.

`PaymentStatus`: `DRAFT`, `PENDING`, `PAID`, `OVERDUE`, `RENEGOTIATED`, `CANCELLED`.

### 6.5 Matrícula digital

**`EnrollmentRequest`** — solicitação autocontida (não depende de `User`): dados do aluno, do
responsável financeiro, do responsável pedagógico (opcional, com flag `isSameGuardian`),
endereço completo, quatro URLs de documentos, campos de auditoria (`reviewedBy`, `reviewedAt`,
`rejectionReason`) e `approvedStudentId` apontando para o aluno criado na aprovação.
`requestNumber` no formato `MAT-2026-0001`.

### 6.6 Comunicação

- **`Announcement`** — mural, com segmentação por role e por série, prioridade e expiração.
- **`Notification`** — notificação por usuário, com `isRead` e `actionUrl`.
- **`Occurrence`** — ocorrência pedagógica: `type` (comportamento, acadêmico, saúde, frequência,
  elogio, outro) × `severity` (`LOW`…`CRITICAL`), ação tomada, e o ciclo de ciência do
  responsável (`parentNotified`, `parentViewedAt`, `parentComments`).
- **`CommunicationThread`** + **`Message`** — mensageria direta. Populada pelo seed, **sem tela**.

### 6.7 Documentos

- **`DocumentTemplate`** — HTML com placeholders `{{variavel}}` + lista de variáveis disponíveis.
- **`GeneratedDocument`** — HTML já renderizado, autor, metadados JSON, `pdfUrl` (não usado).

Tipos previstos: declaração de matrícula, contrato de prestação de serviços, histórico escolar,
atestado de conduta, certificado de matrícula, personalizado.

### 6.8 Configuração

**`Settings`** — pares chave/valor tipados (`text`/`number`/`boolean`/`json`) editáveis em
`/admin/settings` e lidos por helpers em `src/lib/settings.ts`. Chaves semeadas:
`default_tuition_monthly` (1500), `hour_rate`, `enrollment_fee`, `material_fee`,
`late_payment_fine_percentage`, `late_payment_interest_daily`, `auto_generate_billing`,
`billing_due_day` (10), `school_name`, `school_cnpj`.

### 6.9 Convenções do schema

Todas as tabelas têm `createdAt`/`updatedAt`; chaves primárias são `cuid()`; FKs e campos de
busca são indexados; `onDelete: Cascade` propaga de `User` para perfis, de `Student` para
avaliações/frequência/ocorrências, de `Billing` para lembretes/renegociações e de
`CommunicationThread` para mensagens.

---

## 7. Funcionalidades por módulo

### 7.1 Financeiro administrativo (mais completo)

**Painel** (`/admin/financial`) — agrega o mês corrente em uma consulta paralela: total a receber,
recebido, pendente, atrasado; folha total/paga/programada; balanço esperado (a receber − folha) e
balanço real (recebido − pago); contadores de responsáveis, funcionários e alunos; alerta de
cobranças em `DRAFT` aguardando aprovação.

**Cobranças** (`/admin/financial/billings`) — listagem com busca (nº da fatura, descrição, nome
ou CPF do responsável), filtros por status e tipo, paginação; criação manual; edição e exclusão.

**Fluxo de aprovação de cobrança** — quando um aluno é cadastrado com `auto_generate_billing`
ativo, o sistema cria a mensalidade em status `DRAFT` com a nota "Aguardando aprovação do
administrador". A tela `/admin/financial/billings/pending-approval` lista essas cobranças e
permite aprovar (`DRAFT → PENDING`), rejeitar, ou aprovar todas de uma vez.

**Recorrência** — `POST /api/admin/billings/process-recurring` varre cobranças com
`isRecurring` e `nextBillingDate <= hoje`, cria a nova fatura `PENDING` e avança
`nextBillingDate` conforme `MONTHLY`/`QUARTERLY`/`ANNUALLY`, tudo em transação. É um endpoint
disparado manualmente — **não há cron/scheduler configurado**.

**Folha de pagamento** (`/admin/financial/payroll`) — CRUD por funcionário/mês, salário base +
bônus − descontos, status programado/pago/cancelado.

**Régua de cobrança / inadimplência** (`/admin/financial/collection`) — total de faturas vencidas,
valor em atraso, taxa de inadimplência, ordenação por dias de atraso com gradação visual de
severidade; envio de lembrete individual ou em lote com template e variáveis `{{name}}`,
`{{amount}}`, `{{dueDate}}`; modal de renegociação (novo valor, parcelas, nova data, motivo) que
move a fatura para `RENEGOTIATED`. **O envio é simulado** (delay de ~500ms, registro gravado em
`PaymentReminder`) — não há integração de e-mail, SMS ou WhatsApp.

**Cadastros** — `/admin/financial/parents`, `/admin/financial/employees` e
`/admin/financial/students`, cada um com tabela, busca, paginação, criação, edição e exclusão em
massa (`bulk-delete`).

### 7.2 Cadastro de aluno (fluxo transacional mais complexo do sistema)

`POST /api/admin/students` executa em uma única transação:

1. cria o `User` do responsável e o `Parent` (se um responsável existente não foi informado);
2. cria o `User` e o `Student` (`studentId` sequencial `EST0001`);
3. localiza a `Class` por `gradeLevel + section + academicYear` e cria o `Enrollment`
   (falha com mensagem clara se a turma não existir);
4. se `auto_generate_billing` estiver ativo, gera a mensalidade em `DRAFT`, aplicando desconto
   percentual ou fixo, com vencimento no `billing_due_day` (rolando para o mês seguinte se o dia
   já passou) e `recurrence: MONTHLY`.

### 7.3 Matrícula digital

`/matricula` é um formulário público em 5 etapas, mobile-first, validado no servidor por Zod.
Gera `MAT-<ano>-<sequencial>` e grava a solicitação em `PENDING`.
`/admin/enrollment-requests` mostra os contadores por status, o detalhe de cada solicitação e as
ações de aprovar/rejeitar; na aprovação, aluno e responsável são criados a partir dos dados da
solicitação. O painel administrativo exibe um badge com a contagem de pendências.

### 7.4 Diário de classe (portal do professor)

- `/teacher/dashboard` — turmas do professor, total de alunos, atalhos para chamada e notas.
- `/teacher/classes/[classId]/attendance` — chamada com toggles (presente / falta / atraso /
  justificada), observação por aluno, escolha da data, salvamento em lote e resumo automático.
- `/teacher/classes/[classId]/grades` — planilha de notas filtrada por matéria, bimestre e tipo
  de avaliação; valida contra a nota máxima do tipo, calcula o conceito (A–F) e a média da turma,
  salva em lote.

Limitação: `GET /api/teacher/classes` ainda retorna **todas** as turmas para qualquer professor —
há um `TODO` no código pedindo uma relação direta `Teacher → Class`.

### 7.5 Comunicação

`/admin/communication/announcements` cria avisos (título, conteúdo, público-alvo, série,
prioridade, expiração) e os lista em feed cronológico; ao publicar, gera `Notification` para os
usuários do público-alvo (em lote, limitado a 100). `POST /api/admin/occurrences` registra
ocorrências pedagógicas e notifica o responsável — **sem tela dedicada** ainda. A mensageria
(`CommunicationThread`/`Message`) existe apenas no banco.

### 7.6 Documentos

`POST /api/admin/documents/generate` escolhe o template, substitui as variáveis com os dados do
aluno/responsável e grava o HTML em `GeneratedDocument`. `/admin/documents/[id]` exibe o
documento com CSS de impressão e botões de imprimir e baixar HTML. **Não há geração de PDF** —
`jspdf` está instalado mas não usado, e `pdfUrl` permanece nulo.

### 7.7 Portais de responsável e aluno

Ambos são uma única página cada, somente leitura:

- `/parent/dashboard` — nº de filhos, mensalidades pendentes, total a pagar, cards dos filhos com
  turma, e as 10 mensalidades mais recentes.
- `/student/dashboard` — dados da turma, % de frequência e média calculadas a partir dos 10
  últimos registros, últimas notas e presenças.

Ambos leem os models **legados** (`Tuition`, `Grade`, `Attendance`), não `Billing`/`Assessment`/
`AttendanceRecord` — ou seja, não veem o que o professor lança pelo diário nem as cobranças do
módulo financeiro novo.

---

## 8. Mapa de rotas

### Páginas

```
/                                          redireciona por role
/login
/matricula                                 público

/admin/dashboard
/admin/settings
/admin/students/new
/admin/teachers/new
/admin/classes/new
/admin/enrollment-requests
/admin/communication/announcements
/admin/documents/[id]
/admin/financial
/admin/financial/billings           /new   /pending-approval
/admin/financial/payroll            /new
/admin/financial/parents            /new
/admin/financial/employees          /new
/admin/financial/students
/admin/financial/collection

/teacher/dashboard
/teacher/classes/[classId]/attendance
/teacher/classes/[classId]/grades

/parent/dashboard
/student/dashboard
```

Note que existem telas de criação sem a listagem correspondente
(`/admin/students/new`, `/admin/teachers/new`, `/admin/classes/new` — não há `/admin/students`,
`/admin/teachers` nem `/admin/classes`). A navegação para essas telas se dá pelo
`FloatingAddButton`, e a listagem de alunos vive dentro do módulo financeiro.

### API

```
POST   GET     /api/enrollment-requests             POST público
GET PUT DELETE /api/enrollment-requests/[id]        aprovar / rejeitar / cancelar
               /api/auth/[...nextauth]

GET POST       /api/admin/students                  criação transacional completa
POST           /api/admin/students/bulk-delete
POST           /api/admin/teachers
GET POST       /api/admin/employees
GET PUT DELETE /api/admin/employees/[id]
POST           /api/admin/employees/bulk-delete
GET POST       /api/admin/parents
GET PUT DELETE /api/admin/parents/[id]
DELETE         /api/admin/parents/bulk-delete
GET POST       /api/admin/classes

GET POST       /api/admin/billings
GET PUT DELETE /api/admin/billings/[id]
POST           /api/admin/billings/[id]/approve
POST           /api/admin/billings/[id]/reject
GET            /api/admin/billings/pending-approval
POST           /api/admin/billings/approve-all
POST           /api/admin/billings/process-recurring
GET POST       /api/admin/payroll
GET PUT DELETE /api/admin/payroll/[id]
GET            /api/admin/financial-summary
POST GET       /api/admin/payment-reminders
POST GET       /api/admin/payment-renegotiations

POST GET       /api/admin/announcements
POST GET       /api/admin/occurrences
POST           /api/admin/documents/generate
GET            /api/admin/documents/[id]
GET PUT        /api/admin/settings

GET            /api/teacher/classes
POST GET       /api/teacher/attendance             lote
POST GET       /api/teacher/assessments            lote
GET POST       /api/teacher/assessment-types
```

---

## 9. Design system

Definido em `src/app/globals.css` como variáveis HSL em `:root` (com bloco `.dark` presente mas
não acionado por nenhum toggle) e exposto ao Tailwind em `tailwind.config.ts`:

| Token                     | Valor                  | Uso                             |
| ------------------------- | ---------------------- | ------------------------------- |
| `--primary`               | `#1e40af` azul marinho | ação principal, focus ring      |
| `--accent` / `--info`     | `#3b82f6`              | destaque secundário, informação |
| `--success`               | `#10b981`              | confirmação, pago               |
| `--warning`               | `#f59e0b`              | pendente, aguardando            |
| `--destructive`           | `#ef4444`              | erro, exclusão, atrasado        |
| `--background` / `--card` | `#f8fafc` / `#ffffff`  | fundo e superfícies             |
| `--muted-foreground`      | `#64748b`              | texto auxiliar                  |
| `--radius`                | `0.5rem`               | raio base                       |

Componentes em `src/components`: `Button`, `Input`, `Select`, `Card` (com `padding` e `hover`),
`Badge`, `Table` (família `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`),
`SearchBar`, `Pagination`, `EmptyState`, `BackButton`, `Logo`, `PageHeader`, `PageWrapper`,
`FloatingAddButton`, `SettingsForm`.

Regras documentadas em `DESIGN_SYSTEM.md`, `LAYOUT_COMPONENTS.md` e `COMMON_COMPONENTS.md`:
apenas um botão primário por tela, "voltar" sempre no topo à esquerda, `p-6` em cards, `mb-6`
entre seções, cores sempre por token semântico (nunca `bg-gray-800` literal).

**Todos os componentes usam `export default`, exceto a família `Table`** — detalhe que causa o
problema de build descrito abaixo.

---

## 10. Configuração, execução e dados de exemplo

### Variáveis de ambiente (`.env.example` → `.env.local`)

```
DATABASE_URL                            # PostgreSQL
NEXTAUTH_URL, NEXTAUTH_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET   # não usados
NEXT_PUBLIC_APP_NAME
```

### Comandos

```bash
npm install                 # roda prisma generate no postinstall
npx prisma db push          # sincroniza o schema (não há pasta prisma/migrations)
npx prisma db seed          # popula o banco
npm run dev                 # http://localhost:3000
./setup.sh                  # generate + migrate + seed + studio
./run.sh                    # unset das vars de npm problemáticas + npm run dev
./pm2.sh start|stop|restart|status|logs|monit
```

Há um workaround recorrente nos scripts: `unset npm_config_global npm_config_prefix` antes de
qualquer comando npm/npx, para contornar uma configuração global de npm da máquina de origem que
impedia a resolução de `@prisma/client`. O `.npmrc` do projeto fixa `install-links=false`.

### O que o seed cria

Configurações do sistema · admin · equipe de apoio · professores com matérias · responsáveis e
alunos · 27 turmas (9 séries × 3 seções) · matrículas · planos e mensalidades · cobranças ·
notas e frequência (legado) · descontos · despesas · avisos · solicitações de matrícula ·
relacionamentos de responsáveis · tipos de avaliação e avaliações detalhadas · registros de
presença detalhados · cobranças de responsáveis, lembretes e renegociações · contatos
financeiros · ocorrências pedagógicas · threads e mensagens · templates e documentos gerados.
Ao final imprime um resumo contado por tabela.

Credenciais do seed: admin `admin@davilla.com`, senha `password123` (as demais contas usam a
mesma senha).

---

## 11. Estado atual e lacunas conhecidas

Esta seção é a diferença entre o que a documentação existente afirma e o que o código faz.

### 11.1 Seis páginas não compilam (bloqueante)

Estas páginas importam componentes com **named import**, mas os componentes são `export default`:

```
src/app/teacher/dashboard/page.tsx
src/app/teacher/classes/[classId]/attendance/page.tsx
src/app/teacher/classes/[classId]/grades/page.tsx
src/app/admin/enrollment-requests/page.tsx
src/app/admin/financial/collection/page.tsx
src/app/admin/communication/announcements/page.tsx
```

Exemplo: `import { PageHeader } from '@/components/layout/PageHeader'` — `PageHeader` só existe
como default. Além disso, essas páginas passam `title`, `subtitle` e `icon` para `PageHeader`,
que aceita apenas `className` e `children`. As outras seis páginas admin usam
`import PageHeader from ...` corretamente. Ou seja: **todo o portal do professor, a tela de
matrículas online, a régua de cobrança e o mural de avisos estão inacessíveis até que os imports
e a API do `PageHeader` sejam reconciliados.**

### 11.2 Ambiente não inicializado

`node_modules/` ausente e nenhuma pasta `prisma/migrations/` — o schema foi aplicado com
`prisma db push` (conforme `MIGRATION_SUMMARY.md`), então não existe histórico de migração
versionado. Um `npm install` + `prisma db push` é necessário antes de qualquer coisa.

### 11.3 Segurança

- `GET /api/enrollment-requests` **não verifica autenticação** e devolve solicitações completas —
  nome de menor, CPF, telefone, e-mail e endereço dos responsáveis. Deveria exigir `ADMIN`.
- `GET /api/teacher/classes` devolve todas as turmas da escola para qualquer professor.
- `/teacher/*` não está no matcher do middleware.
- Senhas padrão de aluno em texto no código (`"student123"`) e no seed (`password123`).

### 11.4 Corretude

- **Recorrência que nunca dispara:** a mensalidade criada no cadastro do aluno recebe
  `isRecurring: true` e `recurrence: MONTHLY`, mas **não recebe `nextBillingDate`**;
  `process-recurring` filtra por `nextBillingDate <= hoje`, então essas cobranças nunca são
  processadas.
- **Números de fatura por contagem:** `invoiceNumber` é derivado de `count()` + 1, o que colide
  se qualquer registro tiver sido excluído e sob concorrência. O mesmo vale para `studentId`
  (`EST####`). Dois formatos diferentes convivem (`INV000001` e `INV2026000001`).
- **`formatCurrency()` em `src/lib/utils.ts` formata em USD/en-US**, enquanto todas as telas
  formatam BRL manualmente com `toLocaleString("pt-BR")`.
- **`src/lib/constants.ts` está defasado:** séries `"9"`–`"12"`, seções `A`–`D`, matérias em
  inglês e `TERMS` como `"Term 1"`. O domínio real (seed, formulários, plano de redesign) usa
  `"1º Ano"`–`"9º Ano"` e seções `A`–`C`. Há também dois `EMPLOYEE_TYPES` divergentes
  (`constants.ts` com 3 valores em inglês vs. `employee-types.ts` com 11 em português).
- **Dois modelos financeiros paralelos** (`Tuition` para aluno, `Billing` para responsável) e
  **duas gerações de notas/frequência** (`Grade`/`Attendance` vs. `Assessment`/
  `AttendanceRecord`), com telas diferentes lendo lados diferentes — o portal do responsável não
  mostra o que o financeiro cobra, e o do aluno não mostra o que o professor lança.

### 11.5 Integrações prometidas e não feitas

E-mail, SMS e WhatsApp (envio simulado), pagamento online via Stripe, geração de PDF, upload de
arquivos (as URLs de documento da matrícula nunca são preenchidas), notificações push, gráficos
(`recharts`).

### 11.6 Documentação desatualizada

- `README.md` lista `admin@school.com` como conta de teste (o seed cria `admin@davilla.com`),
  descreve os portais admin/pai/aluno como "a implementar" e usa caminhos de outra máquina
  (`/home/gab/Projects/...`).
- `ecosystem.config.js` tem `cwd: '/home/gab/Projects/school-management-system'` hardcoded e roda
  `npm run dev` — precisa ser ajustado (e trocado por `build` + `start`) para qualquer deploy.
- `IMPLEMENTATION_SUMMARY.md` declara "todos os 5 módulos implementados"; na prática quatro
  dessas telas não compilam e partes anunciadas (ocorrências, mensageria, PDF) não têm interface.

### 11.7 Ausências de engenharia

Nenhum teste automatizado; nenhuma configuração de ESLint ou Prettier; nenhum CI; histórico Git
com um único commit; nenhum agendador para as rotinas que dependem de execução periódica
(recorrência de cobranças, marcação de faturas como `OVERDUE`).

---

## 12. Próximos passos sugeridos

**Desbloquear (ordem recomendada)**

1. Padronizar os imports/API do `PageHeader` e dos componentes UI para restaurar as 6 páginas.
2. `npm install` + `prisma db push` + `db seed` e validar cada portal de ponta a ponta.
3. Proteger `GET /api/enrollment-requests`, incluir `/teacher` no middleware e tratar a role
   `TEACHER` em `src/app/page.tsx`.
4. Corrigir `nextBillingDate` na cobrança gerada no cadastro de aluno.
5. Substituir a geração de identificadores por `count()` por sequência/transação.

**Consolidar o domínio**

6. Decidir entre `Tuition` e `Billing` (e entre `Grade`/`Assessment`) e migrar as telas legadas
   para o modelo escolhido — hoje é a maior fonte de divergência funcional.
7. Atualizar `constants.ts` para o domínio real e eliminar o `EMPLOYEE_TYPES` duplicado.
8. Criar a relação `Teacher → Class` para que o professor veja só as suas turmas.
9. Adicionar as listagens ausentes (`/admin/students`, `/admin/teachers`, `/admin/classes`) e uma
   navegação persistente (sidebar) em lugar do botão flutuante.

**Evoluir**

10. Integrações reais de e-mail/WhatsApp, PDF dos documentos, upload de arquivos, Stripe.
11. Agendador (cron ou rota protegida chamada externamente) para recorrência e vencimentos.
12. Telas de ocorrências e mensageria; boletim (`AcademicReport`) alimentado por `Assessment`.
13. ESLint + Prettier + testes das regras financeiras (desconto, vencimento, recorrência) e CI.

---

## 13. Documentação relacionada no repositório

| Arquivo                                                    | Conteúdo                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `README.md`                                                | instalação e execução (parcialmente defasado)                                |
| `SCHEMA_PROPOSAL.md`                                       | proposta original dos 5 módulos avançados                                    |
| `MIGRATION_SUMMARY.md`                                     | o que a migração de schema criou/alterou                                     |
| `IMPLEMENTATION_SUMMARY.md`                                | relatório de implementação dos módulos (otimista)                            |
| `DESIGN_SYSTEM.md`                                         | paleta, tokens e regras de UX                                                |
| `LAYOUT_COMPONENTS.md`                                     | `PageHeader`, `PageWrapper`, `BackButton`, `Card`, `Button`                  |
| `COMMON_COMPONENTS.md`                                     | `Table`, `Input`, `Select`, `Badge`, `SearchBar`, `EmptyState`, `Pagination` |
| `PM2_SETUP.md`                                             | operação com PM2, boot automático, logs                                      |
| `docs/plans/2026-02-23-class-structure-redesign-design.md` | design do redesign de turmas                                                 |
| `docs/plans/2026-02-23-class-structure-redesign.md`        | plano de execução tarefa por tarefa                                          |
