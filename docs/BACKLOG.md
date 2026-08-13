# BACKLOG

Itens identificados durante a execução das fases, fora do escopo da fase corrente.
Cada item registra o contexto necessário para ser retomado sem redescobrir o problema.

## Segurança de dependências

- **22 vulnerabilidades no `npm audit`** (1 low, 5 moderate, 13 high, 3 critical), detectadas no
  `npm install` da Fase 0. Não tratadas para não misturar upgrade de dependência com correção
  funcional. Rodar `npm audit` e avaliar `audit fix` (sem `--force`) antes do primeiro deploy.
- **Prisma 5.22 → 7.9** (major disponível). Envolve mudanças de API do client; fazer em branch
  própria, depois da Fase 4, quando o schema estiver estável.
- **Next.js/React**: verificar se há patch de segurança pendente junto com o item acima.

## Corretude conhecida, não bloqueante

- **`Assessment` unique incompleta** (`prisma/schema.prisma:798`):
  `[studentId, subjectId, assessmentTypeId, term, academicYear]` não inclui `classId`. Impede que
  o mesmo aluno tenha a mesma matéria em duas turmas no mesmo período (caso de reforço ou turma
  optativa). Reavaliar junto com a Fase 4.2, que introduz `ClassSubjectTeacher`.
- **`Discount.value` é polissêmico**: guarda percentual (0-100) ou valor fixo, discriminado por
  `DiscountType`. Morre na Fase 4.3 junto com `Tuition`; se o conceito de desconto voltar em
  `Billing`, modelar com dois campos ou um `Decimal` + enum explícito.
- **Geração de `invoiceNumber` em dois formatos**: `INV000001` (cadastro de aluno,
  `api/admin/students/route.ts:287`) e `INV2026000001` (criação manual,
  `api/admin/billings/route.ts:138`). Unificado na Fase 3.4.

## Integração com PSP brasileiro (substitui Stripe)

Stripe foi removido do projeto (Fase 5.9) — a decisão é usar um PSP brasileiro com boleto + PIX
(candidatos: Asaas, Iugu, Efí, Cora). Escopo da integração quando houver conta:

1. Emissão de cobrança no PSP a partir de `Billing` (boleto + PIX com QR).
2. Webhook de conciliação criando `Payment` (model da Fase 3.5) com `externalId` do PSP —
   `Billing.status` continua derivado da soma dos pagamentos, sem escrita direta pelo webhook.
3. Idempotência por `externalId` (webhook do PSP reentrega).
4. Baixa manual continua possível para dinheiro e transferência.
5. Conciliação de divergência (valor pago ≠ valor devido) precisa de tela no financeiro.

## Soft delete e retenção

- **`Payroll` não tem `deletedAt`.** A fase 2.8 aplicou soft delete a Student, Parent, Employee,
  Billing e EnrollmentRequest, conforme especificado. Payroll é financeiro e provavelmente deveria
  seguir a mesma regra; hoje `DELETE /api/admin/payroll/[id]` remove a linha de fato.
- **Não há tela de lixeira nem restauração.** Registros com `deletedAt` só voltam por SQL. A
  extensão do Prisma em `src/lib/prisma.ts` já permite ler os apagados quando a query passa
  `deletedAt` explicitamente — a tela pode ser construída sobre isso.
- **Retenção do `AuditLog` e do `DataSubjectRequest`** não tem rotina de expurgo. O aviso de
  privacidade promete 5 anos para a trilha de auditoria; falta o job que aplica isso.
- **`GRADE_LEVELS` do formulário público** (`1º Ano EF` … `3º Ano EM`) não casa com as séries do
  restante do sistema (`1º Ano` … `9º Ano`). Uma matrícula aprovada gera aluno com série que não
  corresponde a nenhuma turma. Resolver na fase 4 junto com `constants.ts`.
- **`requestNumber` tem dois formatos**: o seed grava `ENR-2026-0001` e a API gera `MAT-2026-0001`.
  A geração ainda deriva do último registro criado, então prefixos diferentes zeram o contador.
  Endereçado na fase 3.4.

## Produto / UX

- **Portal do aluno e do responsável são somente leitura e rasos** (uma tela cada). Depois da
  Fase 5.3 (boletim), avaliar: histórico de pagamentos com 2ª via, agenda/calendário escolar,
  autorização de saída, comunicação com a escola.
- **Dark mode**: `globals.css` define o bloco `.dark` completo, mas nada aciona a classe. Ou
  implementa o toggle, ou remove o bloco para não sugerir suporte inexistente.
- **`AcademicReport`** (boletim consolidado) existe no schema e no seed desde o início e nunca
  teve tela nem API. Endereçado na Fase 5.3.
