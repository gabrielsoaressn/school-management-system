/**
 * Outbound messaging.
 *
 * One entry point, one driver chosen by NOTIFICATION_DRIVER. Today only the
 * console driver exists, so nothing leaves the machine and the reset link is
 * readable in the server log during development. Phase 5.4 adds the real email
 * driver (and the WhatsApp stub) behind this same interface — call sites do not
 * change when it lands.
 */

export type NotificationChannel = "EMAIL" | "WHATSAPP" | "SMS";

export interface OutboundMessage {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
}

export interface NotificationDriver {
  name: string;
  send(message: OutboundMessage): Promise<void>;
}

const consoleDriver: NotificationDriver = {
  name: "console",
  async send(message) {
    console.info(
      `[notification:console] ${message.channel} -> ${message.to}\n` +
        (message.subject ? `assunto: ${message.subject}\n` : "") +
        message.body
    );
  },
};

function resolveDriver(): NotificationDriver {
  const configured = process.env.NOTIFICATION_DRIVER ?? "console";

  switch (configured) {
    case "console":
      return consoleDriver;
    default:
      console.warn(
        `[notification] driver "${configured}" não implementado; usando console`
      );
      return consoleDriver;
  }
}

export async function send(message: OutboundMessage): Promise<void> {
  await resolveDriver().send(message);
}

function appUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${appUrl()}/reset-password/${token}`;

  await send({
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
  await send({
    channel: "EMAIL",
    to,
    subject: "Acesso ao portal D'Ávilla",
    body:
      `Sua conta foi criada no portal da escola.\n\n` +
      `E-mail: ${to}\nSenha provisória: ${temporaryPassword}\n\n` +
      `Você precisará trocar esta senha no primeiro acesso: ${appUrl()}/login`,
  });
}
