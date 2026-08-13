# Deploy

Aplicação Next.js 15 + PostgreSQL, servida por PM2 em um único processo.

## Variáveis de ambiente

Obrigatórias:

| Variável          | Para quê                    | Observação                                                  |
| ----------------- | --------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`    | Prisma (CLI e app)          | precisa estar em `.env` **e** ser visível ao app            |
| `NEXTAUTH_URL`    | NextAuth e links de e-mail  | URL pública, com https                                      |
| `NEXTAUTH_SECRET` | assinatura do JWT de sessão | `openssl rand -base64 32`; trocar invalida todas as sessões |
| `CRON_SECRET`     | `POST /api/cron/daily`      | sem ela a rotina recusa tudo                                |

Opcionais:

| Variável                                                                                | Padrão      | Efeito                                                             |
| --------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `NOTIFICATION_DRIVER`                                                                   | `console`   | `smtp` envia e-mail de verdade                                     |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` / `SMTP_SECURE` | —           | exigidas com `smtp`; sem elas cai para `console` com aviso         |
| `STORAGE_DRIVER`                                                                        | `local`     | `s3` ainda não implementado (lança erro em vez de gravar no disco) |
| `STORAGE_LOCAL_DIR`                                                                     | `./storage` | uploads; **fora** de `public/`, nunca servidos estaticamente       |
| `LOG_LEVEL`                                                                             | `info`      | `debug` em desenvolvimento                                         |

O Prisma CLI lê `.env`; o Next lê `.env` e `.env.local`. Ambos estão no `.gitignore`.

## Primeiro deploy

```bash
git clone <repo> && cd school-management-system
cp .env.example .env            # preencher; DATABASE_URL e NEXTAUTH_SECRET são obrigatórios
npm ci
npx prisma migrate deploy       # nunca `migrate dev` em produção
npm run build
pm2 start ecosystem.config.js
pm2 save                        # sobrevive a reboot junto com `pm2 startup`
```

**Não rode `npx prisma db seed` em produção**: o seed apaga todos os dados antes de recriar.

## Deploy de uma nova versão

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js  # reload, não restart: derruba menos requisições
```

Ordem importa: migrations antes do build, porque o build faz type-check contra o
schema gerado.

## Rollback

O que fazer depende de a versão ruim ter migrado o banco ou não.

**Sem migration nova** (o caso comum):

```bash
git checkout <tag-ou-sha-anterior>
npm ci && npm run build
pm2 reload ecosystem.config.js
```

**Com migration nova:** migrations do Prisma não têm `down`. Reverter significa
escrever a migration inversa ou restaurar o backup. Antes de qualquer deploy que
inclua migration destrutiva (remoção de coluna ou tabela):

1. tire um backup e **confirme que ele restaura** (ver abaixo);
2. verifique se a versão anterior do código funciona com o schema novo — se sim,
   o rollback é só de código;
3. se não, o caminho é restaurar o backup, e isso implica perder o que foi
   gravado depois dele. Avise a secretaria antes.

Migrations puramente aditivas (coluna nova opcional, tabela nova) são seguras: a
versão anterior do código as ignora.

## Backup

```bash
# Diário, com retenção de 30 dias
pg_dump --format=custom --no-owner "$DATABASE_URL" \
  > /var/backups/davilla/davilla-$(date +%F).dump
find /var/backups/davilla -name '*.dump' -mtime +30 -delete
```

```cron
0 2 * * * /usr/local/bin/davilla-backup.sh >> /var/log/davilla-backup.log 2>&1
```

**Um backup não testado não é um backup.** Uma vez por mês, restaure em um banco
descartável e confira:

```bash
createdb davilla_restore_test
pg_restore --dbname=davilla_restore_test --no-owner /var/backups/davilla/davilla-<data>.dump

psql davilla_restore_test -c 'select count(*) from "Student"'
psql davilla_restore_test -c 'select count(*) from "Billing"'
psql davilla_restore_test -c 'select max("invoiceNumber") from "Billing"'
dropdb davilla_restore_test
```

Ao restaurar em um banco que voltará a ser usado, reposicione as sequências —
elas não vêm no lugar certo se o dump for parcial:

```sql
SELECT setval('invoice_number_seq', (SELECT count(*) FROM "Billing") + 1, false);
SELECT setval('student_id_seq', (SELECT count(*) FROM "Student") + 1, false);
SELECT setval('employee_id_seq', (SELECT count(*) FROM "Employee") + 1, false);
SELECT setval('enrollment_request_number_seq', (SELECT count(*) FROM "EnrollmentRequest") + 1, false);
```

Backup dos uploads (`STORAGE_LOCAL_DIR`) é separado do banco e igualmente
necessário: são documentos de matrícula.

## Rotina diária

`POST /api/cron/daily` marca faturas vencidas e gera recorrências. Agendamento,
autenticação e verificação em `docs/OPERATIONS.md`.

## Por que um processo só

`exec_mode: fork`, uma instância. Duas coisas impedem escalar horizontalmente
hoje:

- **rate limit em memória** (`src/lib/rate-limit.ts`): cada processo tem o seu
  contador, então N processos multiplicam o limite efetivo por N;
- **driver de storage local**: os uploads vão para o disco da máquina que
  atendeu, e outra instância não os encontra.

Antes de escalar: contadores em Redis (ou limite na borda) e driver S3.

## Checklist antes de ir ao ar

- [ ] `NEXTAUTH_SECRET` e `CRON_SECRET` gerados para este ambiente, não copiados
- [ ] `NODE_ENV=production` (as credenciais de teste da tela de login só aparecem fora de produção)
- [ ] HTTPS com certificado válido — a sessão vai em cookie
- [ ] `npx prisma migrate deploy` aplicado e `migrate diff` reportando vazio
- [ ] backup automatizado e **restauração testada**
- [ ] `/api/cron/daily` agendado e a primeira execução conferida no `AuditLog`
- [ ] `npm audit` revisado (ver `docs/BACKLOG.md`)
