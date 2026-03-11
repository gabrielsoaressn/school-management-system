#!/bin/bash

# Script para configurar e executar o School Management System
# Workaround para problema de configuração do npm

echo "🚀 School Management System - Setup"
echo "===================================="
echo ""

# Limpar variáveis de ambiente do npm que causam problemas
unset npm_config_global
unset npm_config_prefix

# Verificar se DATABASE_URL está configurado
if grep -q "postgresql://user:password@localhost" .env.local; then
    echo "⚠️  ATENÇÃO: Você precisa configurar DATABASE_URL no arquivo .env.local"
    echo ""
    echo "Exemplos:"
    echo "  Local:  postgresql://postgres:suasenha@localhost:5432/school_management"
    echo "  Neon:   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/school_management"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Passo 1/4: Gerando cliente Prisma..."
npx prisma generate

echo ""
echo "Passo 2/4: Executando migrations do banco de dados..."
npx prisma migrate dev --name init

echo ""
echo "Passo 3/4: Populando banco com dados de exemplo..."
npx prisma db seed

echo ""
echo "Passo 4/4: Verificando instalação..."
npx prisma studio &

echo ""
echo "✅ Setup concluído!"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Pressione Ctrl+C para fechar o Prisma Studio"
echo "   2. Execute: ./run.sh"
echo "   3. Acesse: http://localhost:3000"
echo ""
echo "📧 Contas de teste:"
echo "   Admin:   admin@school.com / password123"
echo "   Parent:  parent1@example.com / password123"
echo "   Student: student1_1@example.com / password123"
echo ""
