module.exports = {
  apps: [
    {
      name: 'school-management-system',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/gab/Projects/school-management-system',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        npm_config_global: '',
        npm_config_prefix: ''
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      kill_timeout: 5000,
      wait_ready: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
