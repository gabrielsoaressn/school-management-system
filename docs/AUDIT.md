# AUDIT — Fase 0

Verificação executada em 2026-08-12 contra o commit `5c9571a`, com dependências instaladas,
Postgres 16 em Docker, migration `20260812032019_baseline` aplicada e seed rodado.

Este documento **substitui** `projeto.md` como fonte de verdade sobre o estado do código.
Onde os dois divergem, vale este.

## Ambiente do baseline

| Item | Valor |
|---|---|
| Postgres | container `davilla-postgres`, `postgres:16`, porta host **5434** (5433 estava ocupada) |
| `DATABASE_URL` | `postgresql://davilla:davilla@localhost:5434/school_management?schema=public` |
| Migration | `prisma/migrations/20260812032019_baseline/` (versionada) |
| Seed | 123 usuários, 50 alunos, 15 professores, 50 responsáveis, 27 turmas, 90 matérias, 300 tuitions, 60 billings |
| `npm install` | 354 pacotes, **22 vulnerabilidades** (3 críticas, 13 altas) — ver BACKLOG |

Dois arquivos de env são necessários e ambos estão no `.gitignore`: `.env` (lido pelo **Prisma
CLI**) e `.env.local` (lido pelo **Next.js**). Ambos carregam `DATABASE_URL`. As variáveis do
Stripe foram deliberadamente omitidas — saem do projeto na Fase 5.9.

---

## 1. Páginas que não compilam

`npx tsc --noEmit` → **76 erros em 8 arquivos**. O `projeto.md` dizia 6 páginas; são **8**.

| Arquivo | Erros | Causa |
|---|---|---|
| `src/app/matricula/page.tsx` | 24 | 4× TS2614 + 20× TS7006 |
| `src/app/admin/communication/announcements/page.tsx` | 13 | TS2614 + TS7006 |
| `src/app/teacher/classes/[classId]/grades/page.tsx` | 9 | TS2614 + TS7006 |
| `src/app/teacher/classes/[classId]/attendance/page.tsx` | 8 | TS2614 + TS7006 |
| `src/app/admin/enrollment-requests/page.tsx` | 8 | TS2614 |
| `src/app/admin/financial/collection/page.tsx` | 7 | TS2614 |
| `src/app/teacher/dashboard/page.tsx` | 5 | TS2614 |
| `src/app/admin/documents/[id]/page.tsx` | 2 | TS2614 |

- **TS2614 (47 erros)** — named import de componente que só tem `export default`.
  Ex.: `src/app/matricula/page.tsx:5` → `import { Button } from '@/components/ui/Button'`.
- **TS7006 (29 erros)** — `Parameter 'e' implicitly has an 'any' type`, sempre em `onChange`.
  São **consequência** do TS2614: com o import quebrado o componente vira tipo de erro e os props
  de JSX perdem tipagem. Devem desaparecer ao corrigir os imports; confirmar depois.

**Correção sobre o `projeto.md`:** `/matricula` (formulário público, o de maior alcance) e
`/admin/documents/[id]` também estão quebrados. O documento anterior contou apenas as páginas que
importam `PageHeader`.

### 1.1 Erro que só o build revela

`npm run build` compila o bundle (`✓ Compiled successfully`) e **falha depois**, na checagem de
tipos das rotas:

```
src/app/api/admin/billings/[id]/approve/route.ts
Type error: Route has an invalid "POST" export:
  Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

É a mudança do **Next.js 15**: `params` em route handler agora é `Promise`. `tsc --noEmit` não
pega porque a restrição vem dos tipos gerados em `.next/types` durante o build.

**18 assinaturas em 8 arquivos** precisam virar `{ params }: { params: Promise<{ id: string }> }`
com `await params`:

| Arquivo | Assinaturas |
|---|---|
| `src/app/api/admin/billings/[id]/route.ts` | 3 (linhas 8, 59, 160) |
| `src/app/api/admin/employees/[id]/route.ts` | 3 (8, 56, 161) |
| `src/app/api/admin/parents/[id]/route.ts` | 3 (8, 64, 155) |
| `src/app/api/admin/payroll/[id]/route.ts` | 3 (8, 52, 137) |
| `src/app/api/enrollment-requests/[id]/route.ts` | 3 (10, 53, 269) |
| `src/app/api/admin/billings/[id]/approve/route.ts` | 1 (7) |
| `src/app/api/admin/billings/[id]/reject/route.ts` | 1 (7) |
| `src/app/api/admin/documents/[id]/route.ts` | 1 (9) |

As **páginas** dinâmicas não são afetadas: `/admin/documents/[id]`, `/teacher/classes/[classId]/*`
são client components e leem a rota via `useParams()`.

---

## 2. `PageHeader` — assinatura real vs. esperada

**Real** (`src/components/layout/PageHeader.tsx:13`):

```ts
export default function PageHeader({ className = "", children }: PageHeaderProps)
// PageHeaderProps = { className?: string; children?: ReactNode }
```

Renderiza `<Logo>` à esquerda e `children` à direita. **Não aceita `title`, `subtitle` nem `icon`.**

| Convenção | Páginas |
|---|---|
| `import PageHeader from ...` (correto hoje) | `admin/dashboard`, `admin/financial`, `admin/financial/employees`, `admin/financial/parents`, `admin/financial/students`, `admin/settings` |
| `import { PageHeader } from ...` + props `title`/`subtitle`/`icon` | `teacher/dashboard`, `teacher/classes/[classId]/attendance`, `teacher/classes/[classId]/grades`, `admin/enrollment-requests`, `admin/financial/collection`, `admin/communication/announcements` |

As 6 páginas da segunda linha passam **exatamente** `title`, `subtitle` e `icon` (um componente
`lucide-react`) — nada de `action`, `breadcrumb` ou children estruturados. Exemplo real
(`teacher/classes/[classId]/grades/page.tsx`):

```tsx
<PageHeader
  title={`Lançamento de Notas - ${classData?.name || 'Turma'}`}
  subtitle={`${classData?.gradeLevel} - Turma ${classData?.section}`}
  icon={FileText}
/>
```

**Estado dos exports em `src/components`:** todos usam `export default`, **exceto** a família
`Table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`), que já é
named export. `Input` e `Select` são `export default X` no fim do arquivo; os demais são
`export default function X`.

---

## 3. Campos monetários e seus tipos Prisma

**Nenhum campo `Decimal` existe hoje. 21 campos são `Float`**, dos quais 14 são monetários:

| Model | Campo | Tipo atual | Monetário? |
|---|---|---|---|
| `Employee` | `salary` | `Float` | **sim** |
| `TuitionPlan` | `amount` | `Float` | **sim** (legado, sai na Fase 4) |
| `Tuition` | `amount`, `discountAmount` | `Float` | **sim** (legado, sai na Fase 4) |
| `Discount` | `value` | `Float` | **sim** — ambíguo: percentual *ou* valor fixo (legado) |
| `Billing` | `amount` | `Float` | **sim** |
| `Payroll` | `baseSalary`, `bonus`, `deductions`, `totalAmount` | `Float` | **sim** (4 campos) |
| `Expense` | `amount` | `Float` | **sim** |
| `PaymentRenegotiation` | `originalAmount`, `renegotiatedAmount`, `discount` | `Float` | **sim** (3 campos) |
| `Grade` | `score`, `maxScore` | `Float` | não — nota |
| `Assessment` | `score`, `maxScore` | `Float` | não — nota |
| `AssessmentType` | `weight`, `maxScore` | `Float` | não — peso/nota |
| `AcademicReport` | `gpa`, `attendance` | `Float` | não — média e % |

Escopo da Fase 3.1: os 14 monetários viram `Decimal @db.Decimal(10,2)`. Os 7 restantes ficam
`Float`. Atenção ao `Discount.value`, que mistura percentual e moeda no mesmo campo — a conversão
para `Decimal(10,2)` é aceitável para ambos, mas o campo morre na Fase 4.3 junto com `Tuition`.

---

## 4. Verificação de autenticação por rota

Varredura handler por handler dos 34 arquivos de rota (60 handlers).

| Rota | Método | Verificação | Veredito |
|---|---|---|---|
| `/api/enrollment-requests` | POST | **NENHUMA** | **OK por design** (formulário público) — mas sem rate limit nem honeypot |
| `/api/enrollment-requests` | GET | **NENHUMA** | **VULNERÁVEL** — expõe nome de menor, CPF, telefone, e-mail e endereço dos responsáveis |
| `/api/enrollment-requests/[id]` | GET | **NENHUMA** | **VULNERÁVEL** — mesma exposição, registro a registro, por id enumerável |
| `/api/enrollment-requests/[id]` | PUT / DELETE | sessão + ADMIN | ok |
| `/api/teacher/assessment-types` | GET | **NENHUMA** | **VULNERÁVEL** (baixo impacto: metadados de avaliação) |
| `/api/teacher/assessment-types` | POST | sessão + ADMIN | ok |
| `/api/teacher/assessments` | POST | sessão + ADMIN/TEACHER | **VULNERÁVEL** — não valida se o professor leciona a matéria/turma |
| `/api/teacher/assessments` | GET | sessão, **sem role** | **VULNERÁVEL** — qualquer autenticado (inclusive STUDENT/PARENT) lê nota de qualquer aluno via `?studentId=` |
| `/api/teacher/attendance` | POST | sessão + ADMIN/TEACHER | **VULNERÁVEL** — mesma falta de vínculo professor↔turma |
| `/api/teacher/attendance` | GET | sessão, **sem role** | **VULNERÁVEL** — frequência de qualquer aluno |
| `/api/teacher/classes` | GET | sessão + ADMIN/TEACHER | **VULNERÁVEL** — devolve **todas** as turmas da escola para qualquer professor |
| `/api/admin/announcements` | GET | sessão, sem role (filtra por role da sessão) | ok — segmentação por `session.user.role`, comportamento intencional |
| `/api/admin/occurrences` | GET | sessão, sem role (filtra se PARENT) | **atenção** — PARENT é restrito aos filhos, mas STUDENT e TEACHER veem **todas** as ocorrências |
| `/api/admin/occurrences` | POST | sessão + ADMIN/TEACHER | ok |
| `/api/admin/*` (46 handlers restantes) | GET/POST/PUT/DELETE | sessão + ADMIN | ok |
| `/api/auth/[...nextauth]` | — | NextAuth | n/a |

**Resumo:** 8 handlers com falha real de autorização, em 2 categorias — (a) 4 rotas sem
verificação alguma, sendo 2 com dado pessoal de menor; (b) 4 rotas em que a role é checada mas o
**vínculo** não (professor sem lotação, leitura sem escopo de aluno).

O `projeto.md` reportava apenas `GET /api/enrollment-requests` e a listagem de turmas. As
escritas de nota/chamada sem vínculo e as leituras sem role são achados novos e mais graves:
qualquer conta de aluno autenticada consegue ler as notas de toda a escola.

---

## 5. Formatação de moeda

`formatCurrency` está definida em `src/lib/utils.ts:21` com `Intl.NumberFormat("en-US", { currency: "USD" })`
e **não é usada em lugar nenhum** — zero importações no repositório. Pior que o descrito no
`projeto.md`, que dizia apenas que estava em USD.

Toda formatação é manual: **21 ocorrências** de `toLocaleString("pt-BR", { minimumFractionDigits: 2 })`
e **36 literais `R$`**, distribuídas em 9 arquivos:

```
src/app/admin/dashboard/page.tsx
src/app/admin/financial/page.tsx
src/app/admin/financial/billings/BillingsTable.tsx
src/app/admin/financial/billings/pending-approval/PendingBillingsTable.tsx
src/app/admin/financial/collection/page.tsx
src/app/admin/financial/employees/EmployeesTable.tsx
src/app/admin/financial/payroll/PayrollTable.tsx
src/app/admin/financial/payroll/new/PayrollForm.tsx
src/app/parent/dashboard/page.tsx
```

`formatDate`/`formatDateTime` (mesmo arquivo, linhas 9 e 15) usam `date-fns` com máscara
`"MMM dd, yyyy"` — formato **en-US** (`Aug 12, 2026`). Também não têm consumidor: as telas usam
`new Date(x).toLocaleDateString("pt-BR")` direto. Nenhum ponto do código considera fuso —
`new Date()` é usado cru em cálculos de vencimento (`api/admin/students/route.ts:290`).

---

## 6. `nextBillingDate` no cadastro de aluno — **CONFIRMADO**

`src/app/api/admin/students/route.ts:298-313` cria a mensalidade com:

```ts
status: "DRAFT",
isRecurring: true,
recurrence: "MONTHLY",
// nextBillingDate ausente → null
```

E `src/app/api/admin/billings/process-recurring/route.ts:18-27` filtra por:

```ts
where: { isRecurring: true, recurrence: { not: "NONE" }, nextBillingDate: { lte: today } }
```

`null` nunca satisfaz `lte`. **Toda mensalidade criada pelo cadastro de aluno é invisível para a
rotina de recorrência** — a segunda parcela nunca é gerada. Confirmado também que a criação
manual (`POST /api/admin/billings:141-158`) **preenche** `nextBillingDate` corretamente; o bug é
exclusivo do caminho de cadastro de aluno.

## 7. `GET /api/teacher/classes` devolve todas as turmas — **CONFIRMADO**

`src/app/api/teacher/classes/route.ts:50-103`. O branch `else` (professor) busca o `Employee` e
seus `subjects`, **descarta o resultado** e executa o mesmo `prisma.class.findMany()` sem filtro
do branch de ADMIN. Há um `TODO` na linha 75 reconhecendo a ausência de relação `Teacher → Class`.
Efeito: o dashboard do professor lista as 27 turmas da escola, e ele pode abrir a chamada e o
lançamento de notas de qualquer uma.

---

## 8. Divergências consolidadas em relação ao `projeto.md`

1. São **8** páginas quebradas, não 6 — inclui `/matricula` e `/admin/documents/[id]`.
2. Existe um segundo bloqueio de build **não documentado**: `params` do Next 15 em 18 assinaturas.
3. São **8** handlers com falha de autorização, não 1 — incluindo escrita de nota sem vínculo e
   leitura de notas/frequência por qualquer usuário autenticado.
4. `formatCurrency` não tem *nenhum* consumidor (o documento sugeria uso indevido em USD).
5. A migração do legado é **muito menor** que o previsto: `prisma.tuition` aparece em 2 lugares;
   `prisma.grade`/`prisma.attendance` em nenhum (o `/student/dashboard` os lê por `include`);
   `TuitionPlan` e `Discount` não são lidos por nenhuma tela.
6. `GET /api/admin/occurrences` deixa STUDENT e TEACHER verem todas as ocorrências — não
   mencionado antes.
7. O ambiente tem `psql`, `pg_isready` e `docker` disponíveis; a porta 5433 já estava ocupada.

## 9. Fora de escopo da Fase 0 (foram para `docs/BACKLOG.md`)

- 22 vulnerabilidades de dependência, 3 críticas.
- Prisma 5.22 → 7.9 (major disponível).
- `PUT /api/admin/settings` usa `update` e estoura se a chave não existir (deveria ser `upsert`).
- `Assessment` tem unique em `[studentId, subjectId, assessmentTypeId, term, academicYear]` sem
  `classId` — impede duas turmas com a mesma matéria para o mesmo aluno no mesmo período.
