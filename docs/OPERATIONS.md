# Operações

## Rotina diária

`POST /api/cron/daily` é a única rotina agendada do sistema. Ela:

1. marca como `OVERDUE` as cobranças `PENDING` cuja data de vencimento já passou
   (fuso `America/Sao_Paulo`);
2. gera a próxima parcela das cobranças recorrentes cujo `nextBillingDate` chegou,
   avançando o ponteiro da série.

**Autenticação:** header `x-cron-secret` com o valor de `CRON_SECRET`. A comparação é
feita com `timingSafeEqual`. Sem a variável configurada, a rota recusa tudo — ela nunca
fica aberta por omissão.

**Idempotência:** rodar duas vezes no mesmo dia não duplica nada. O passo 1 é um
`UPDATE` cujo `WHERE` deixa de casar depois da primeira execução; o passo 2 avança o
`nextBillingDate` de cada cobrança dentro da mesma transação que cria a parcela, então a
segunda execução não encontra nada vencido.

### Agendar com cron do servidor

```cron
# Todos os dias às 03:10 (horário do servidor; ajuste se o servidor não estiver em -03)
10 3 * * * curl -fsS -X POST https://SEU_DOMINIO/api/cron/daily \
  -H "x-cron-secret: $CRON_SECRET" >> /var/log/davilla-cron.log 2>&1
```

O `-f` faz o curl retornar erro em resposta 4xx/5xx, o que faz o cron enviar e-mail de
falha para o dono do crontab. Verifique a saída: a resposta traz
`markedOverdue`, `recurringGenerated` e `failures`.

### Agendar com serviço externo

Qualquer agendador HTTP serve (EasyCron, cron-job.org, GitHub Actions com `schedule`,
Vercel Cron). Configure o header `x-cron-secret`. Recomendado: alerta se a resposta não
for 200 por dois dias seguidos.

### Conferir se rodou

Cada execução grava uma linha em `AuditLog` com `action = 'cron.daily'`:

```sql
SELECT "createdAt", after
FROM "AuditLog"
WHERE action = 'cron.daily'
ORDER BY "createdAt" DESC
LIMIT 7;
```

## Rate limit

O limitador (`src/lib/rate-limit.ts`) é **em memória e por processo**. Protege o
formulário público de matrícula, o `forgot-password` e o canal de solicitações LGPD.

Consequências operacionais:

- rodar mais de um processo (cluster do PM2, réplicas) multiplica o limite efetivo pelo
  número de processos;
- um deploy zera os contadores.

Enquanto for um processo único, está adequado. Ao escalar, mover os contadores para Redis
ou aplicar o limite na borda (nginx `limit_req`, Cloudflare).

## Variáveis de ambiente

| Variável               | Onde é lida                                      | Obrigatória                  |
| ---------------------- | ------------------------------------------------ | ---------------------------- |
| `DATABASE_URL`         | Prisma CLI (`.env`) e app (`.env.local`)         | sim                          |
| `NEXTAUTH_URL`         | NextAuth e links de e-mail                       | sim                          |
| `NEXTAUTH_SECRET`      | assinatura do JWT de sessão                      | sim                          |
| `CRON_SECRET`          | `POST /api/cron/daily`                           | sim, para a rotina funcionar |
| `NOTIFICATION_DRIVER`  | `src/lib/notifications` (`console` por enquanto) | não                          |
| `NEXT_PUBLIC_APP_NAME` | interface                                        | não                          |

O Prisma CLI lê `.env`; o Next lê `.env` e `.env.local` (com `.env.local` tendo
precedência). Ambos estão no `.gitignore`.

## Banco de dados em desenvolvimento

```bash
docker run -d --name davilla-postgres \
  -e POSTGRES_USER=davilla -e POSTGRES_PASSWORD=davilla \
  -e POSTGRES_DB=school_management -p 5434:5432 postgres:16

npx prisma migrate deploy   # aplica as migrations versionadas
npx prisma db seed          # popula dados de exemplo
```

O seed **apaga** todos os dados antes de recriar. Nunca aponte para produção.

## Migrations

Toda mudança de schema é uma migration versionada em `prisma/migrations/`. Nunca use
`prisma db push` neste projeto: o histórico é o que permite reproduzir o banco.

Para mudanças de tipo que o `migrate dev` marca como potencialmente destrutivas (por
exemplo `Float` → `Decimal`), gere o SQL sem interatividade:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_nome/migration.sql
npx prisma migrate deploy
```

Revise o SQL gerado antes de aplicar.

## Identificadores

`invoiceNumber`, `studentId`, `employeeId` e `requestNumber` vêm de sequências do
Postgres (`invoice_number_seq`, `student_id_seq`, `employee_id_seq`,
`enrollment_request_number_seq`). Sequências não voltam atrás: uma transação revertida
deixa um buraco na numeração, o que é esperado e preferível a um número duplicado.

Ao restaurar um backup em outro banco, confira se as sequências ficaram acima do maior
valor em uso:

```sql
SELECT setval('invoice_number_seq', (SELECT count(*) FROM "Billing") + 1, false);
```

## Pendências operacionais

Ainda não feitos (registrados em `docs/BACKLOG.md`): rotina de backup do Postgres com
teste de restauração, procedimento de rollback de deploy, expurgo de retenção do
`AuditLog`, e a configuração de produção do PM2 (hoje o `ecosystem.config.js` roda
`npm run dev` com `cwd` fixo de outra máquina).
