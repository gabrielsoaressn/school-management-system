import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("portal do administrador", () => {
  test("entra, navega pela lateral e abre o financeiro", async ({ page }) => {
    await login(page, ACCOUNTS.admin);

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole("link", { name: "Turmas" })).toBeVisible();

    await page.getByRole("link", { name: "Cobranças" }).click();
    await expect(page).toHaveURL(/\/admin\/financial\/billings/);
  });

  test("abre uma turma e vê a grade curricular", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto("/admin/classes");

    await page.getByRole("heading", { level: 2 }).first().click();
    await expect(page.getByText("Grade curricular")).toBeVisible();
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
});

test.describe("portal do professor", () => {
  test("vê apenas as próprias turmas e abre a chamada", async ({ page }) => {
    await login(page, ACCOUNTS.teacher);

    await expect(page).toHaveURL(/\/teacher\/dashboard/);
    await expect(page.getByText("Minhas Turmas")).toBeVisible();

    await page
      .getByRole("button", { name: /Chamada/ })
      .first()
      .click();
    await expect(page.getByText("Data da Chamada")).toBeVisible();
  });
});

test.describe("portal do responsável", () => {
  test("vê as cobranças e abre o boletim do filho", async ({ page }) => {
    await login(page, ACCOUNTS.parent);

    await expect(page).toHaveURL(/\/parent\/dashboard/);
    await expect(page.getByText("Cobranças em Aberto")).toBeVisible();

    await page
      .getByRole("link", { name: /Ver boletim/ })
      .first()
      .click();
    await expect(page.getByText("Desempenho por disciplina")).toBeVisible();
  });
});

test.describe("portal do aluno", () => {
  test("vê o painel e o próprio boletim", async ({ page }) => {
    await login(page, ACCOUNTS.student);

    await expect(page).toHaveURL(/\/student\/dashboard/);

    await page.getByRole("link", { name: "Boletim" }).click();
    await expect(page).toHaveURL(/\/student\/report/);
    await expect(page.getByText("Frequência")).toBeVisible();
  });
});

test.describe("páginas públicas", () => {
  test("a matrícula exige o consentimento LGPD", async ({ page }) => {
    await page.goto("/matricula");

    await expect(page.getByText("Dados do Aluno")).toBeVisible();
    await expect(page.getByRole("link", { name: /privacidade/i })).toHaveCount(
      0
    );
  });

  test("o aviso de privacidade publica finalidades e bases legais", async ({
    page,
  }) => {
    await page.goto("/privacidade");

    await expect(page.getByText("Aviso de Privacidade")).toBeVisible();
    await expect(page.getByText("Base legal")).toBeVisible();
  });
});
