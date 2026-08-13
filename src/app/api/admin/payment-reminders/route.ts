import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  created,
  fail,
  notFound,
  paginated,
  serverError,
  validationFailed,
} from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { send } from "@/lib/notifications";

const reminderSchema = z.object({
  billingId: z.string(),
  reminderType: z.enum(["EMAIL", "WHATSAPP", "SMS", "SYSTEM"]),
  subject: z.string().optional(),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
});

const bulkReminderSchema = z.object({
  billingIds: z.array(z.string()),
  reminderType: z.enum(["EMAIL", "WHATSAPP", "SMS", "SYSTEM"]),
  subject: z.string().optional(),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
});

// POST - Enviar lembrete (individual ou em lote)
export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = await request.json();

      // Verificar se é envio em lote
      if (body.billingIds && Array.isArray(body.billingIds)) {
        const validatedData = bulkReminderSchema.parse(body);

        // Buscar billings
        const billings = await prisma.billing.findMany({
          where: {
            id: { in: validatedData.billingIds },
            status: { in: ["PENDING", "OVERDUE"] },
          },
          include: {
            parent: true,
          },
        });

        if (billings.length === 0) {
          return fail("Nenhuma fatura encontrada para enviar lembretes");
        }

        // Criar lembretes em lote
        const reminders = await prisma.$transaction(
          billings.map((billing) =>
            prisma.paymentReminder.create({
              data: {
                billingId: billing.id,
                reminderType: validatedData.reminderType,
                status: "SENT",
                recipientName: `${billing.parent.firstName} ${billing.parent.lastName}`,
                recipientEmail:
                  validatedData.reminderType === "EMAIL"
                    ? billing.parent.email || ""
                    : undefined,
                recipientPhone:
                  validatedData.reminderType === "WHATSAPP" ||
                  validatedData.reminderType === "SMS"
                    ? billing.parent.whatsappNumber ||
                      billing.parent.phoneNumber
                    : undefined,
                subject: validatedData.subject,
                message: validatedData.message
                  .replace("{{name}}", billing.parent.firstName)
                  .replace("{{amount}}", `R$ ${billing.amount.toFixed(2)}`)
                  .replace(
                    "{{dueDate}}",
                    new Date(billing.dueDate).toLocaleDateString("pt-BR")
                  ),
                templateUsed: "default",
                sentAt: new Date(),
              },
            })
          )
        );

        // Envio real pela camada de notificação. O status gravado é o que de fato
        // aconteceu: o código anterior esperava 500ms e marcava tudo como
        // DELIVERED, então a régua sempre parecia ter funcionado.
        await Promise.all(
          reminders.map(async (reminder) => {
            const destination =
              reminder.recipientEmail ?? reminder.recipientPhone ?? "";

            if (!destination) {
              await prisma.paymentReminder.update({
                where: { id: reminder.id },
                data: {
                  status: "FAILED",
                  errorMessage: "Responsável sem e-mail/telefone cadastrado",
                },
              });
              return;
            }

            const result = await send({
              channel: reminder.reminderType === "EMAIL" ? "EMAIL" : "WHATSAPP",
              to: destination,
              subject: reminder.subject ?? undefined,
              body: reminder.message,
            });

            await prisma.paymentReminder.update({
              where: { id: reminder.id },
              data: result.delivered
                ? { status: "DELIVERED", deliveredAt: new Date() }
                : {
                    status: "FAILED",
                    errorMessage: result.error ?? "Falha no envio",
                  },
            });
          })
        );

        await recordAudit({
          action: "billing.remind",
          entity: "Billing",
          actor: user,
          request,
          after: {
            billingIds: validatedData.billingIds,
            reminderType: validatedData.reminderType,
            count: reminders.length,
          },
        });

        return created(reminders, {
          message: `${reminders.length} lembretes enviados com sucesso!`,
        });
      } else {
        // Envio individual
        const validatedData = reminderSchema.parse(body);

        const billing = await prisma.billing.findUnique({
          where: { id: validatedData.billingId },
          include: { parent: true },
        });

        if (!billing) {
          return notFound("Fatura não encontrada");
        }

        const reminder = await prisma.paymentReminder.create({
          data: {
            billingId: billing.id,
            reminderType: validatedData.reminderType,
            status: "SENT",
            recipientName: `${billing.parent.firstName} ${billing.parent.lastName}`,
            recipientEmail:
              validatedData.reminderType === "EMAIL"
                ? billing.parent.email || ""
                : undefined,
            recipientPhone:
              validatedData.reminderType === "WHATSAPP" ||
              validatedData.reminderType === "SMS"
                ? billing.parent.whatsappNumber || billing.parent.phoneNumber
                : undefined,
            subject: validatedData.subject,
            message: validatedData.message
              .replace("{{name}}", billing.parent.firstName)
              .replace("{{amount}}", `R$ ${billing.amount.toFixed(2)}`)
              .replace(
                "{{dueDate}}",
                new Date(billing.dueDate).toLocaleDateString("pt-BR")
              ),
            templateUsed: "default",
            sentAt: new Date(),
          },
        });

        const destination =
          reminder.recipientEmail ?? reminder.recipientPhone ?? "";

        const result = destination
          ? await send({
              channel: reminder.reminderType === "EMAIL" ? "EMAIL" : "WHATSAPP",
              to: destination,
              subject: reminder.subject ?? undefined,
              body: reminder.message,
            })
          : {
              delivered: false,
              driver: "none",
              error: "Responsável sem e-mail/telefone cadastrado",
            };

        const updated = await prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: result.delivered
            ? { status: "DELIVERED", deliveredAt: new Date() }
            : {
                status: "FAILED",
                errorMessage: result.error ?? "Falha no envio",
              },
        });

        await recordAudit({
          action: "billing.remind",
          entity: "Billing",
          entityId: reminder.billingId,
          actor: user,
          request,
          after: { reminderType: reminder.reminderType },
        });

        return created(updated, {
          message: result.delivered
            ? "Lembrete enviado com sucesso!"
            : `Lembrete registrado, mas não entregue: ${result.error}`,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationFailed(error);
      }
      return serverError(error, "Erro ao enviar lembrete");
    }
  },
  { permission: "billing:remind" }
);

// GET - Listar lembretes
export const GET = withAuth(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const billingId = searchParams.get("billingId");
      const status = searchParams.get("status");
      const reminderType = searchParams.get("reminderType");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");

      const skip = (page - 1) * limit;
      const where: any = {};

      if (billingId) where.billingId = billingId;
      if (status) where.status = status;
      if (reminderType) where.reminderType = reminderType;

      const [reminders, total] = await Promise.all([
        prisma.paymentReminder.findMany({
          where,
          skip,
          take: limit,
          include: {
            billing: {
              include: {
                parent: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { sentAt: "desc" },
        }),
        prisma.paymentReminder.count({ where }),
      ]);

      return paginated(reminders, { total: total, page: page, limit: limit });
    } catch (error) {
      return serverError(error, "Erro ao buscar lembretes");
    }
  },
  { permission: "billing:read" }
);
