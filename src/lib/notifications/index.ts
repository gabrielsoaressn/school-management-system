import { consoleDriver } from "./drivers/console";
import { createSmtpDriver } from "./drivers/smtp";
import { whatsappDriver } from "./drivers/whatsapp";
import type { NotificationDriver, OutboundMessage } from "./types";

export type { NotificationChannel, OutboundMessage } from "./types";

/**
 * Outbound messaging.
 *
 * One entry point, drivers chosen per channel by environment variable, so the
 * call sites never know how a message leaves the building.
 *
 *   NOTIFICATION_DRIVER=console | smtp   (default: console)
 *   WHATSAPP_DRIVER=stub                 (only option today)
 *
 * Everything the app "sent" used to be a console.log or a fake 500ms delay
 * inside the route that pretended to send it.
 */

let emailDriver: NotificationDriver | null = null;

function resolveEmailDriver(): NotificationDriver {
  if (emailDriver) return emailDriver;

  const configured = process.env.NOTIFICATION_DRIVER ?? "console";

  switch (configured) {
    case "smtp": {
      const driver = createSmtpDriver();

      if (!driver) {
        console.warn(
          "[notification] NOTIFICATION_DRIVER=smtp mas SMTP_HOST/SMTP_USER não configurados; usando console"
        );
        emailDriver = consoleDriver;
        break;
      }

      emailDriver = driver;
      break;
    }
    case "console":
      emailDriver = consoleDriver;
      break;
    default:
      console.warn(
        `[notification] driver "${configured}" desconhecido; usando console`
      );
      emailDriver = consoleDriver;
  }

  return emailDriver;
}

function driverFor(channel: OutboundMessage["channel"]): NotificationDriver {
  switch (channel) {
    case "EMAIL":
      return resolveEmailDriver();
    case "WHATSAPP":
    case "SMS":
      return whatsappDriver;
    default:
      return consoleDriver;
  }
}

export interface SendResult {
  delivered: boolean;
  driver: string;
  error?: string;
}

/**
 * Sends a message. Never throws: a failed send is reported so the caller can
 * record it (PaymentReminder keeps a status per attempt) without losing the
 * operation that triggered it.
 */
export async function send(message: OutboundMessage): Promise<SendResult> {
  const driver = driverFor(message.channel);

  try {
    await driver.send(message);
    return { delivered: true, driver: driver.name };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erro desconhecido";
    console.error(`[notification:${driver.name}] falha ao enviar`, reason);
    return { delivered: false, driver: driver.name, error: reason };
  }
}

function appUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${appUrl()}/reset-password/${token}`;

  return send({
    channel: "EMAIL",
    to,
    subject: "Redefinição de senha - D'Ávilla",
    body:
      `Recebemos um pedido para redefinir a sua senha.\n\n` +
      `Abra o link abaixo para escolher uma nova senha. Ele vale por 1 hora e ` +
      `só pode ser usado uma vez:\n\n${link}\n\n` +
      `Se não foi você que pediu, ignore esta mensagem: nada muda na sua conta.`,
  });
}

export async function sendTemporaryPasswordEmail(
  to: string,
  temporaryPassword: string
) {
  return send({
    channel: "EMAIL",
    to,
    subject: "Acesso ao portal D'Ávilla",
    body:
      `Sua conta foi criada no portal da escola.\n\n` +
      `E-mail: ${to}\nSenha provisória: ${temporaryPassword}\n\n` +
      `Você precisará trocar esta senha no primeiro acesso: ${appUrl()}/login`,
  });
}
