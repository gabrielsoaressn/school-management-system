#!/bin/bash

# Script de gerenciamento rápido do PM2

case "$1" in
  start)
    echo "🚀 Iniciando servidor..."
    pm2 start ecosystem.config.js
    ;;
  stop)
    echo "⏸️  Parando servidor..."
    pm2 stop school-management-system
    ;;
  restart)
    echo "🔄 Reiniciando servidor..."
    pm2 restart school-management-system
    ;;
  status)
    pm2 status
    ;;
  logs)
    pm2 logs school-management-system
    ;;
  monit)
    pm2 monit
    ;;
  *)
    echo "📋 Uso: $0 {start|stop|restart|status|logs|monit}"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start   - Inicia o servidor"
    echo "  stop    - Para o servidor"
    echo "  restart - Reinicia o servidor"
    echo "  status  - Mostra status do servidor"
    echo "  logs    - Mostra logs em tempo real"
    echo "  monit   - Monitor de recursos"
    exit 1
    ;;
esac
