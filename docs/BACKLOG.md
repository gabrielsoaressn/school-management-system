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

- **`Assessment` unique ainda não inclui `classId`**:
  `[studentId, subjectId, assessmentTypeId, term, academicYearId]`. Impede que o mesmo aluno tenha
  a mesma disciplina em duas turmas no mesmo período (reforço, optativa). Com
  `ClassSubjectTeacher` no lugar, a decisão agora é: uma disciplina pertence a uma turma, então o
  caso só aparece se a escola passar a oferecer turmas paralelas.
- **`Discount.value` é polissêmico**: guarda percentual (0-100) ou valor fixo, discriminado por
  `DiscountType`. Morre na Fase 4.3 junto com `Tuition`; se o conceito de desconto voltar em
  `Billing`, modelar com dois campos ou um `Decimal` + enum explícito.
- **Geração de `invoiceNumber` em dois formatos**: `INV000001` (cadastro de aluno,
  `api/admin/students/route.ts:287`) e `INV2026000001` (criação manual,
  `api/admin/billings/route.ts:138`). Unificado na Fase 3.4.

## Integração com PSP brasileiro (Stripe removido do projeto na fase 5.9)

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

## Pendências da fase 4

- **Rematrícula não tem tela.** `previewReEnrollment`/`runReEnrollment` estão expostos em
  `GET/POST /api/admin/re-enrollment` e funcionam, mas a secretaria precisa de uma tela para
  revisar a lista, marcar retidos e confirmar. Hoje só por API.
- **Ano letivo não tem tela.** Criar ano, virar o ano corrente (`setCurrentAcademicYear`) e fechar
  o anterior são funções de `src/lib/academic-year.ts` sem interface. Um sistema sem ano corrente
  recusa toda escrita acadêmica com mensagem clara, mas não há como resolver pela interface.
- **`AcademicReport`** continua sem tela e agora também sem vínculo com `AcademicYear` (usa
  `academicYear String`). Endereçar junto com o boletim (fase 5.3).
- **Desconto não é estrutural em `Billing`.** O desconto concedido na matrícula é registrado no
  texto da nota, não em campo próprio — herdado do modelo `Discount` que era legado e saiu na 4.3.
  Se a escola precisar de relatório de descontos concedidos, virar campo.
- **Turmas paralelas de um mesmo aluno** não são possíveis: `Enrollment` é único por
  `[studentId, academicYearId]`. Correto para o ensino fundamental regular; reforço e
  contraturno exigiriam outro modelo.

## Produto / UX

- **Portal do aluno e do responsável são somente leitura e rasos** (uma tela cada). Depois da
  Fase 5.3 (boletim), avaliar: histórico de pagamentos com 2ª via, agenda/calendário escolar,
  autorização de saída, comunicação com a escola.
- **Dark mode**: `globals.css` define o bloco `.dark` completo, mas nada aciona a classe. Ou
  implementa o toggle, ou remove o bloco para não sugerir suporte inexistente.
- **`AcademicReport`** (boletim consolidado) existe no schema e no seed desde o início e nunca
  teve tela nem API. Endereçado na Fase 5.3.
