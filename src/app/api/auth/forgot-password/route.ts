import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withoutAuth } from "@/lib/api-auth";
import { fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RESET_TOKEN_TTL_MS, createResetToken } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/notifications";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

/**
 * POST /api/auth/forgot-password — public.
 *
 * Always answers the same way, whether or not the address exists: a different
 * response would turn this endpoint into a way to enumerate accounts.
 */
export const POST = withoutAuth(async (request) => {
  try {
    const limited = rateLimit(`forgot-password:${clientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!limited.allowed) {
      return fail(
        "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        429
      );
    }

    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.isActive) {
      const { token, tokenHash } = createResetToken();

      await prisma.$transaction([
        // One live token per user: previous ones are burned.
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            requestIp: clientIp(request),
          },
        }),
      ]);

      await sendPasswordResetEmail(user.email, token);
    }

    return ok(null, {
      message:
        "Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, "Erro ao solicitar redefinição de senha");
  }
});
