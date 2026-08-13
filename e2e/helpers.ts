import type { Page } from "@playwright/test";

/** Seed accounts. All share the seed password. */
export const ACCOUNTS = {
  admin: "admin@davilla.com",
  finance: "staff3@davilla.com",
  secretary: "staff2@davilla.com",
  teacher: "professor1@davilla.com",
  parent: "responsavel1@davilla.com",
  student: "aluno1@davilla.com",
} as const;

export const SEED_PASSWORD = "password123";

/** Logs in through the real form, so the session cookie is set the real way. */
export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}
