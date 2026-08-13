/**
 * PM2 configuration for production.
 *
 * Runs the compiled app (`npm start`), not the dev server, and takes its working
 * directory from where PM2 was started rather than a path hardcoded to somebody
 * else's machine — the previous version pointed at /home/gab/Projects and ran
 * `npm run dev`, which would have served a development build in production.
 *
 * Deploy: npm ci && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js
 * See docs/DEPLOYMENT.md.
 */
module.exports = {
  apps: [
    {
      name: "davilla",
      script: "npm",
      args: "start",
      cwd: __dirname,
      instances: 1,
      // Single instance on purpose: the rate limiter counts in process memory
      // (src/lib/rate-limit.ts) and the local storage driver writes to this
      // machine's disk. Both need attention before scaling out.
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      time: true,
      merge_logs: true,
      kill_timeout: 5000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
