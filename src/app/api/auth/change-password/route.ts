import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import { fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string(),
});

/**
 * POST /api/auth/change-password — for the logged-in user.
 *
 * Also the exit from a forced first-access change: clearing
 * mustChangePassword is what lets the account leave /trocar-senha.
 */
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const account = await prisma.user.findUnique({ where: { id: user.id } });

    if (!account) {
      return fail("Conta não encontrada", 404);
    }

    if (!(await verifyPassword(currentPassword, account.password))) {
      return fail("Senha atual incorreta", 400);
    }

    if (currentPassword === newPassword) {
      return fail("A nova senha deve ser diferente da atual", 400);
    }

    const check = validatePassword(newPassword, { email: account.email });
    if (!check.valid) {
      return fail(check.errors[0], 400, { errors: check.errors });
    }

    await prisma.user.update({
      where: { id: account.id },
      data: {
        password: await hashPassword(newPassword),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    return ok(null, { message: "Senha alterada com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, "Erro ao alterar senha");
  }
});
