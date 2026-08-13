import nodemailer, { type Transporter } from "nodemailer";
import type { NotificationDriver } from "../types";

/**
 * Real e-mail over SMTP.
 *
 * SMTP rather than a vendor SDK: a school already has a mailbox, and this works
 * with Google Workspace, a hosting provider, or a transactional service like
 * Resend/SendGrid via their SMTP endpoint — no lock-in and no extra dependency
 * per vendor.
 *
 *   NOTIFICATION_DRIVER=smtp
 *   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASSWORD
 *   SMTP_FROM ("Escola D'Ávilla <nao-responda@dominio>")
 *   SMTP_SECURE=true for port 465
 */
let transporter: Transporter | null = null;

export function createSmtpDriver(): NotificationDriver | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const from = process.env.SMTP_FROM ?? `Escola D'Ávilla <${user}>`;

  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass: password },
  });

  return {
    name: "smtp",
    async send(message) {
      if (message.channel !== "EMAIL") {
        throw new Error(`Driver SMTP não envia no canal ${message.channel}`);
      }

      await transporter!.sendMail({
        from,
        to: message.to,
        subject: message.subject ?? "Mensagem da Escola D'Ávilla",
        text: message.body,
      });
    },
  };
}
