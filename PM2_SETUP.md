# Configuração do PM2 para School Management System

## 1. Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

## 2. Iniciar a aplicação com PM2

```bash
cd /home/gab/Projects/school-management-system
pm2 start ecosystem.config.js
```

## 3. Configurar para iniciar automaticamente no boot

✅ **JÁ CONFIGURADO!** O PM2 está configurado para iniciar automaticamente via crontab.

A configuração usa `@reboot` no crontab para ressuscitar os processos salvos do PM2.

Se precisar reconfigurar manualmente:
```bash
pm2 save
crontab -e
# Adicione: @reboot PM2_HOME=/home/gab/.pm2 /usr/local/bin/pm2 resurrect
```

## 4. Comandos úteis do PM2

```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs school-management-system

# Parar a aplicação
pm2 stop school-management-system

# Reiniciar a aplicação
pm2 restart school-management-system

# Remover a aplicação do PM2
pm2 delete school-management-system

# Ver informações detalhadas
pm2 show school-management-system

# Monitorar recursos em tempo real
pm2 monit
```

## 5. Verificar se está funcionando

Após configurar, você pode:
- Reiniciar o computador
- Verificar se o servidor está rodando: `pm2 status`
- Acessar http://localhost:3000

## Logs

Os logs ficam salvos em:
- `/home/gab/Projects/school-management-system/logs/pm2-error.log` - erros
- `/home/gab/Projects/school-management-system/logs/pm2-out.log` - output normal
- `/home/gab/Projects/school-management-system/logs/pm2-combined.log` - combinado

## Desinstalar startup automático

Se quiser remover o início automático:

```bash
pm2 unstartup
pm2 delete school-management-system
```

## Configuração do ecosystem.config.js

O arquivo `ecosystem.config.js` contém toda a configuração:
- Nome do processo: `school-management-system`
- Script: `npm run dev`
- Auto-restart: habilitado
- Limite de memória: 1GB
- Variáveis de ambiente configuradas
- Logs organizados
