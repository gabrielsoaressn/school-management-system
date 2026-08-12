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

- **`PUT /api/admin/settings`** (`src/app/api/admin/settings/route.ts:43`) usa `prisma.settings.update`
  em loop. Se o payload trouxer uma chave que não existe na tabela, a rota estoura com P2025 e
  falha em silêncio parcial (algumas chaves já atualizadas, outras não). Deve ser `upsert` dentro
  de uma transação.
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

## Produto / UX

- **Portal do aluno e do responsável são somente leitura e rasos** (uma tela cada). Depois da
  Fase 5.3 (boletim), avaliar: histórico de pagamentos com 2ª via, agenda/calendário escolar,
  autorização de saída, comunicação com a escola.
- **Dark mode**: `globals.css` define o bloco `.dark` completo, mas nada aciona a classe. Ou
  implementa o toggle, ou remove o bloco para não sugerir suporte inexistente.
- **`AcademicReport`** (boletim consolidado) existe no schema e no seed desde o início e nunca
  teve tela nem API. Endereçado na Fase 5.3.
