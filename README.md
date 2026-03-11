# 🏫 School Management System

Sistema completo de gestão escolar com três portais distintos (Admin, Pais e Estudantes).

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executar](#executar)
- [Contas de Teste](#contas-de-teste)
- [Estrutura do Projeto](#estrutura-do-projeto)

## 🛠 Tecnologias

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Autenticação:** NextAuth.js
- **Pagamentos:** Stripe
- **PDFs:** jsPDF

## 📥 Instalação

O projeto já está configurado! Os pacotes já foram instalados.

## ⚙️ Configuração

### 1. Configurar Banco de Dados

Edite o arquivo `.env.local` e atualize a `DATABASE_URL`:

```bash
# Para PostgreSQL local
DATABASE_URL="postgresql://postgres:suasenha@localhost:5432/school_management"

# Para Neon (recomendado - grátis)
# 1. Acesse https://neon.tech
# 2. Crie uma conta e um projeto
# 3. Copie a connection string
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/school_management"
```

### 2. Opção A - Usando PostgreSQL Local

```bash
# Instalar PostgreSQL (se necessário)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE school_management;
\q
```

### 2. Opção B - Usando Neon (Recomendado - Mais Fácil)

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a "Connection String"
5. Cole no `.env.local` na variável `DATABASE_URL`

## 🚀 Executar

### Método Rápido (Recomendado)

```bash
cd /home/gab/Projects/school-management-system

# 1. Executar setup (apenas primeira vez)
./setup.sh

# 2. Iniciar servidor de desenvolvimento
./run.sh
```

### Método Manual

```bash
cd /home/gab/Projects/school-management-system

# Limpar variáveis do npm (importante!)
unset npm_config_global npm_config_prefix

# 1. Gerar Prisma Client
npx prisma generate

# 2. Criar tabelas no banco
npx prisma migrate dev --name init

# 3. Popular com dados de exemplo
npx prisma db seed

# 4. Iniciar servidor
npm run dev
```

Acesse: **http://localhost:3000**

## 🔐 Contas de Teste

Após executar o seed, você pode fazer login com:

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@school.com | password123 |
| **Professor** | teacher1@school.com | password123 |
| **Pai/Mãe** | parent1@example.com | password123 |
| **Estudante** | student1_1@example.com | password123 |

## 📂 Estrutura do Projeto

```
school-management-system/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados de exemplo
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   ├── admin/         # Portal Admin (a implementar)
│   │   ├── parent/        # Portal Pais (a implementar)
│   │   ├── student/       # Portal Estudante (a implementar)
│   │   ├── login/         # Página de login
│   │   └── page.tsx       # Redirecionamento por role
│   ├── components/        # Componentes React
│   ├── lib/
│   │   ├── prisma.ts      # Cliente Prisma
│   │   ├── auth.ts        # Utilitários de auth
│   │   ├── utils.ts       # Funções auxiliares
│   │   └── constants.ts   # Constantes
│   └── types/             # TypeScript types
├── .env.local             # Variáveis de ambiente
├── setup.sh               # Script de setup
└── run.sh                 # Script para executar
```

## 🎯 Funcionalidades Implementadas

### ✅ Concluído
- [x] Setup do projeto
- [x] Schema do banco completo (20+ models)
- [x] Sistema de autenticação (NextAuth)
- [x] Proteção de rotas (RBAC)
- [x] Página de login
- [x] Seed com dados de exemplo
  - 1 Admin
  - 5 Professores
  - 10 Pais
  - 20+ Estudantes
  - 32 Classes
  - Notas, Presenças, Pagamentos

### 🚧 A Implementar
- [ ] Portal Admin (Dashboard, CRUD completo)
- [ ] Portal Pais (Performance, Pagamentos)
- [ ] Portal Estudante (Notas, Horários)
- [ ] Componentes compartilhados (Tabelas, Forms)
- [ ] Integração Stripe
- [ ] Geração de PDFs

## 🔧 Comandos Úteis

```bash
# Visualizar banco de dados
npx prisma studio

# Resetar banco (apaga tudo e recria)
npx prisma migrate reset

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Popular banco novamente
npx prisma db seed

# Ver logs do servidor
npm run dev
```

## 🐛 Solução de Problemas

### Erro: "Could not resolve @prisma/client"
```bash
unset npm_config_global npm_config_prefix
npm install
npx prisma generate
```

### Erro: "P1001: Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env.local`
- Teste a conexão: `psql $DATABASE_URL`

### Erro: Migration falhou
```bash
npx prisma migrate reset  # Atenção: apaga todos os dados!
./setup.sh
```

## 📚 Próximos Passos

1. ✅ Testar login com as contas de exemplo
2. 🚧 Implementar Dashboard Admin
3. 🚧 Criar páginas de gestão (Estudantes, Professores)
4. 🚧 Implementar Portal dos Pais
5. 🚧 Implementar Portal do Estudante

## 📄 Licença

Este é um projeto educacional/demonstração.

---

**Desenvolvido com ❤️ usando Next.js e Prisma**
