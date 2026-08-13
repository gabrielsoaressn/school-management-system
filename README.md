# D'Ávilla — Sistema de Gestão Escolar

Sistema de gestão para escola de ensino fundamental brasileira (1º ao 9º ano),
com quatro portais — administração, professor, responsável e aluno — e um
formulário público de matrícula.

Next.js 15 (App Router) · TypeScript strict · PostgreSQL + Prisma · NextAuth.

**Demo:** <https://gabrielsoaressn.github.io/school-management-system/> — as
telas dos quatro portais com dados fictícios, sem login e sem banco.

---

## Começando

Requisitos: Node 22+, Docker (ou um PostgreSQL 16 acessível).

```bash
npm ci

# Banco de desenvolvimento
docker run -d --name davilla-postgres \
  -e POSTGRES_USER=davilla -e POSTGRES_PASSWORD=davilla \
  -e POSTGRES_DB=school_management -p 5434:5432 postgres:16

cp .env.example .env
# DATABASE_URL="postgresql://davilla:davilla@localhost:5434/school_management?schema=public"
# NEXTAUTH_SECRET=$(openssl rand -base64 32)

npx prisma migrate deploy   # aplica as migrations versionadas
npx prisma db seed          # dados de exemplo (APAGA tudo antes)
npm run dev
```

`http://localhost:3000`

O Prisma CLI lê `.env`; o Next lê `.env` e `.env.local`. Ambos precisam do
`DATABASE_URL` e estão no `.gitignore`.

### Contas do seed

Senha de todas: `password123`. Exibidas na tela de login **apenas** fora de
produção.

| Perfil        | E-mail                     | O que vê                                |
| ------------- | -------------------------- | --------------------------------------- |
| Administrador | `admin@davilla.com`        | tudo                                    |
| Financeiro    | `staff3@davilla.com`       | cobranças, folha, salários              |
| Secretaria    | `staff2@davilla.com`       | alunos, matrículas; **não** vê salários |
| Coordenação   | `staff1@davilla.com`       | turmas, notas, ocorrências              |
| Professor     | `professor1@davilla.com`   | apenas as turmas em que leciona         |
| Responsável   | `responsavel1@davilla.com` | cobranças e boletim dos filhos          |
| Aluno         | `aluno1@davilla.com`       | suas notas e frequência                 |

## Comandos

| Comando                           | O que faz                             |
| --------------------------------- | ------------------------------------- |
| `npm run dev`                     | servidor de desenvolvimento           |
| `npm run build` / `npm start`     | build de produção / servir            |
| `npm run typecheck`               | `tsc --noEmit`                        |
| `npm run lint` / `lint:fix`       | ESLint                                |
| `npm run format` / `format:check` | Prettier                              |
| `npm test`                        | Vitest (parte dos testes exige banco) |
| `npx playwright test`             | smoke E2E dos portais (exige seed)    |
| `npx prisma studio`               | inspecionar o banco                   |
| `npm run demo:dev`                | demo estática em `localhost:3001`     |
| `npm run demo:build`              | build da demo em `demo/out`           |
| `npm run demo:typecheck`          | `tsc --noEmit` só da demo             |

CI roda typecheck, lint, format:check, testes unitários e build em cada push, e
depois o smoke E2E em banco migrado e semeado (`.github/workflows/ci.yml`).

## Demo

<https://gabrielsoaressn.github.io/school-management-system/>

O sistema é server-side — Prisma, sessão, rotas de API — e não roda como site
estático. Por isso a demo é um **segundo app Next** em `demo/`, com
`output: "export"`, cujas telas leem uma escola inventada em `demo/lib/mock.ts`
em vez do banco. Nenhum dado ali corresponde a pessoa real e nada é gravado.

O que a demo não duplica: os componentes de UI vêm de `src/components` e a
paleta vem de `src/app/globals.css`, então o visual acompanha o app. O que ela
duplica de propósito: as telas, porque as do app são componentes de servidor que
consultam o banco.

`.github/workflows/pages.yml` publica a cada push em `master` que toque
`demo/`, `src/components/` ou a paleta. Requer, uma vez, **Settings → Pages →
Source: GitHub Actions** no repositório.

```bash
npm run demo:dev                     # localhost:3001, sem basePath
npm run demo:build                   # gera demo/out com basePath /school-management-system
DEMO_BASE_PATH="" npm run demo:build # para servir na raiz de um domínio
```

## Como o domínio funciona

Quatro decisões explicam a maior parte do código:

**O ano letivo é uma entidade.** `AcademicYear` tem exatamente um ano corrente,
garantido por índice único parcial. Turma, matrícula, avaliação e chamada
pertencem a um ano.

**A série do aluno está na matrícula, não no aluno.** Um aluno está no 3º ano _em
2026_ e no 4º _em 2027_. `Enrollment` guarda série, seção, situação
(`ACTIVE`/`COMPLETED`/`RETAINED`/`TRANSFERRED`) e é única por aluno/ano. É isso
que permite histórico e rematrícula.

**A grade curricular autoriza o professor.** `ClassSubjectTeacher` diz quem
leciona o quê em cada turma, e é a única coisa que permite lançar nota ou
chamada — verificado no servidor, não só na interface.

**Dinheiro é `Decimal`, data é São Paulo.** Todo valor monetário é
`Decimal(10,2)` e toda aritmética passa por `src/lib/money.ts`. Todo "hoje",
vencimento e dia de calendário passa por `src/lib/datetime.ts`, sempre em
`America/Sao_Paulo`.

## Estrutura

```
prisma/
  schema.prisma            37 models; migrations versionadas em migrations/
  seed.ts                  dados de exemplo
  migrations-data/         migrações de dados pontuais, já aplicadas
src/
  app/                     rotas (App Router) e API
  components/              UI, layout, formulários
  lib/
    permissions.ts         matriz de capacidades — a autoridade sobre acesso
    api-auth.ts            withAuth: todo handler passa por aqui
    api-response.ts        envelope { success, data, error, pagination? }
    money.ts / datetime.ts dinheiro e datas
    billing-rules.ts       multa, juros e recorrência
    payments.ts            status da cobrança derivado dos recibos
    academic-year.ts       ano corrente
    enrollment.ts          único caminho de escrita de matrícula
    teaching.ts            o que cada professor pode tocar
    re-enrollment.ts       promoção de ano
    report-card.ts         boletim calculado
    notifications/         drivers de envio (console, smtp, whatsapp stub)
    storage/               uploads (local, s3 previsto)
demo/
  app/                     telas da demo estática (GitHub Pages)
  components/              casca de navegação e boletim da demo
  lib/mock.ts              a escola fictícia inteira
docs/
  AUDIT.md                 estado real do código — a fonte de verdade
  BACKLOG.md               pendências conhecidas, com contexto
  OPERATIONS.md            rotina diária, rate limit, env, migrations
  DEPLOYMENT.md            deploy, rollback, backup
  history/                 documentos de intenção de fases anteriores
```

## Segurança e LGPD

- Autorização por matriz de capacidades (`src/lib/permissions.ts`), aplicada no
  middleware, nas páginas e em **todos** os handlers via `withAuth`.
- Folha de pagamento e salários: só `ADMIN` e `FINANCE`. Os campos são removidos
  do payload para os outros perfis.
- `AuditLog` registra operações financeiras, exclusões, mudanças de configuração
  e acesso a listagens com CPF.
- Soft delete em tudo que contém dado pessoal ou financeiro; uma extensão do
  Prisma filtra os registros apagados automaticamente.
- Consentimento na matrícula com data e versão do texto; `/privacidade` publica
  finalidades, bases legais e prazos, com canal de solicitação do titular.
- Documentos enviados na matrícula ficam fora de `public/` e só são lidos por
  rota autenticada.

## Estado do projeto

`docs/AUDIT.md` é a fonte de verdade sobre o que existe e o que falta.
Resumo do que **não** está pronto:

- rematrícula e ano letivo funcionam por API, sem tela;
- mensageria (`CommunicationThread`/`Message`) tem schema e dados, sem interface;
- driver S3 e envio por WhatsApp não implementados (ambos falham de forma
  explícita, não silenciosa);
- integração com PSP brasileiro (boleto/PIX) especificada em `docs/BACKLOG.md`,
  não implementada.
