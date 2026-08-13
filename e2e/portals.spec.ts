import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

/**
 * Selectors here are role-based and scoped on purpose.
 *
 * Plain text lookups were ambiguous against the real DOM — "Cobranças" is both a
 * sidebar link and a page action, "Frequência" is both a heading and a stat
 * label, "Dados do Aluno" is both a step in the progress bar and the section
 * heading. Playwright's strict mode is right to refuse those: a test that
 * matches two elements is a test that does not know what it is asserting.
 */

/** The desktop sidebar, so a nav link is never confused with a page action. */
const sidebar = (page: import("@playwright/test").Page) =>
  page.locator("aside");

test.describe("portal do administrador", () => {
  test("entra, navega pela lateral e abre o financeiro", async ({ page }) => {
    await login(page, ACCOUNTS.admin);

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(
      sidebar(page).getByRole("link", { name: "Turmas" })
    ).toBeVisible();

    await sidebar(page).getByRole("link", { name: "Cobranças" }).click();
    await expect(page).toHaveURL(/\/admin\/financial\/billings/);
  });

  test("abre uma turma e vê a grade curricular", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto("/admin/classes");

    // The card itself is the link; clicking the heading inside it is fragile.
    await page.locator('a[href^="/admin/classes/c"]').first().click();

    await expect(
      page.getByRole("heading", { name: "Grade curricular" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Alunos matriculados" })
    ).toBeVisible();
  });
});

test.describe("separação de acesso", () => {
  test("a secretaria não abre a folha de pagamento", async ({ page }) => {
    await login(page, ACCOUNTS.secretary);
    await page.goto("/admin/financial/payroll");

    // O middleware redireciona para o painel da própria função.
    await expect(page).not.toHaveURL(/\/admin\/financial\/payroll/);
  });

  test("o financeiro abre a folha de pagamento", async ({ page }) => {
    await login(page, ACCOUNTS.finance);
    await page.goto("/admin/financial/payroll");

    await expect(page).toHaveURL(/\/admin\/financial\/payroll/);
  });

  test("o professor não entra no painel administrativo", async ({ page }) => {
    await login(page, ACCOUNTS.teacher);
    await page.goto("/admin/dashboard");

    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test("a secretaria não vê a folha no menu lateral", async ({ page }) => {
    await login(page, ACCOUNTS.secretary);

    // A navegação é filtrada pela mesma matriz de permissões da API.
    await expect(
      sidebar(page).getByRole("link", { name: "Folha de pagamento" })
    ).toHaveCount(0);
  });
});

test.describe("portal do professor", () => {
  test("vê apenas as próprias turmas e abre a chamada", async ({ page }) => {
    await login(page, ACCOUNTS.teacher);

    await expect(page).toHaveURL(/\/teacher\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Minhas Turmas" })
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Chamada/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/teacher\/classes\/.+\/attendance/);
    await expect(page.getByLabel("Data da Chamada")).toBeVisible();
  });
});

test.describe("portal do responsável", () => {
  test("vê as cobranças e abre o boletim do filho", async ({ page }) => {
    await login(page, ACCOUNTS.parent);

    await expect(page).toHaveURL(/\/parent\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Cobranças em Aberto" })
    ).toBeVisible();

    await page
      .getByRole("link", { name: /Ver boletim/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/parent\/students\/.+\/report/);
    await expect(
      page.getByRole("heading", { name: "Desempenho por disciplina" })
    ).toBeVisible();
  });
});

test.describe("portal do aluno", () => {
  test("vê o painel e o próprio boletim", async ({ page }) => {
    await login(page, ACCOUNTS.student);

    await expect(page).toHaveURL(/\/student\/dashboard/);

    await sidebar(page).getByRole("link", { name: "Boletim" }).click();

    await expect(page).toHaveURL(/\/student\/report/);
    await expect(
      page.getByRole("heading", { name: "Frequência" })
    ).toBeVisible();
  });
});

test.describe("páginas públicas", () => {
  test("o formulário de matrícula abre no primeiro passo", async ({ page }) => {
    await page.goto("/matricula");

    await expect(
      page.getByRole("heading", { name: "Dados do Aluno" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Próximo" })).toBeVisible();
  });

  test("o aviso de privacidade publica finalidades e bases legais", async ({
    page,
  }) => {
    await page.goto("/privacidade");

    await expect(
      page.getByRole("heading", { name: "Aviso de Privacidade" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Base legal" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Retenção" })
    ).toBeVisible();
  });
});
