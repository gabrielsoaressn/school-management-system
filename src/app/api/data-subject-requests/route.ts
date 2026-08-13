import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withoutAuth } from "@/lib/api-auth";
import { created, fail, serverError, validationFailed } from "@/lib/api-response";
import { clientIp, looksLikeBot, rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { send } from "@/lib/notifications";
import { DATA_PROTECTION_CONTACT } from "@/lib/privacy";

const schema = z.object({
  type: z.enum(["ACCESS", "DELETION", "CORRECTION", "PORTABILITY"]),
  requesterName: z.string().min(3, "Informe seu nome completo"),
  requesterEmail: z.string().email("E-mail inválido"),
  requesterCpf: z.string().optional(),
  studentName: z.string().optional(),
  description: z.string().min(10, "Descreva o pedido com mais detalhes"),
});

/**
 * POST /api/data-subject-requests — public.
 *
 * LGPD art. 18 requests. Public on purpose: the person asking may have no
 * account, or may be asking precisely because they want it removed.
 */
export const POST = withoutAuth(async (request) => {
  try {
    const limited = rateLimit(`dsr:${clientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limited.allowed) {
      return fail("Muitas solicitações. Tente novamente mais tarde.", 429);
    }

    const body = await request.json();

    if (looksLikeBot(body)) {
      return fail("Dados inválidos");
    }

    const data = schema.parse(body);

    const year = new Date().getFullYear();
    const countThisYear = await prisma.dataSubjectRequest.count({
      where: { protocol: { startsWith: `LGPD-${year}-` } },
    });
    const protocol = `LGPD-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

    const dsr = await prisma.dataSubjectRequest.create({
      data: { ...data, protocol },
    });

    await recordAudit({
      action: "data_subject_request.create",
      entity: "DataSubjectRequest",
      entityId: dsr.id,
      request,
      after: { protocol, type: data.type },
    });

    // The school has 15 days to answer (LGPD art. 19, §2º).
    await send({
      channel: "EMAIL",
      to: DATA_PROTECTION_CONTACT.email,
      subject: `Nova solicitação LGPD ${protocol} (${data.type})`,
      body:
        `Solicitante: ${data.requesterName} <${data.requesterEmail}>\n` +
        (data.studentName ? `Aluno(a): ${data.studentName}\n` : "") +
        `Tipo: ${data.type}\n\n${data.description}\n\n` +
        `Prazo de resposta: 15 dias.`,
    });

    await send({
      channel: "EMAIL",
      to: data.requesterEmail,
      subject: `Recebemos sua solicitação ${protocol}`,
      body:
        `Registramos seu pedido sob o protocolo ${protocol}.\n\n` +
        `Responderemos em até 15 dias. Guarde este número para acompanhar.`,
    });

    return created(
      { protocol },
      { message: "Solicitação registrada. Você receberá a resposta por e-mail." }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailed(error);
    }
    return serverError(error, "Erro ao registrar solicitação");
  }
});
