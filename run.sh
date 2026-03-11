#!/bin/bash

# Script para executar o servidor de desenvolvimento
# Workaround para problema de configuração do npm

echo "🚀 Iniciando School Management System..."
echo ""

# Limpar variáveis de ambiente do npm que causam problemas
unset npm_config_global
unset npm_config_prefix

# Iniciar servidor
npm run dev
