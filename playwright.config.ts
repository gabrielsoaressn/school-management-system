import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke: one flow per portal, against a real build and a real
 * database.
 *
 * Deliberately shallow. The unit tests cover the rules (money, permissions,
 * identifiers); these answer a different question — does each portal still load
 * and do its one central action for the role that owns it? That is what breaks
 * when a layout, a session or a redirect changes, and it is exactly what no test
 * covered before.
 *
 * Requires: migrations applied and `npx prisma db seed` run (the specs log in
 * with seed accounts). Browsers: `npx playwright install chromium`.
 */
/**
 * An empty E2E_BASE_URL means "not set" here. `??` would accept it and every
 * test would navigate to a blank origin.
 */
const externalBaseUrl = process.env.E2E_BASE_URL?.trim() || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000/login",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
