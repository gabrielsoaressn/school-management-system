import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withoutAuth } from "@/lib/api-auth";
import { fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashPassword, hashResetToken, validatePassword } from "@/lib/password";

const schema = z.object({
  token: z.string().min(20, "Token inválido"),
  password: z.string(),
});

/** POST /api/auth/reset-password — consumes a reset token, single use. */
export const POST = withoutAuth(async (request) => {
  try {
    const limited = rateLimit(`reset-password:${clientIp(request)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limited.allowed) {
      return fail("Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const { token, password } = schema.parse(body);

    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      include: { user: true },
    });

    // Same answer for missing, expired and already-used tokens.
    if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
      return fail("Link inválido ou expirado. Solicite um novo.", 400);
    }

    const check = validatePassword(password, { email: stored.user.email });
    if (!check.valid) {
      return fail(check.errors[0], 400, { errors: check.errors });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: {
          password: await hashPassword(password),
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      // Any other pending token for this user is now moot.
      prisma.passwordResetToken.updateMany({
        where: { userId: stored.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return ok(null, { message: "Senha redefinida com sucesso. Faça login." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, "Erro ao redefinir senha");
  }
});
