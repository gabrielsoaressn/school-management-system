import type { NotificationDriver } from "../types";

/**
 * Writes the message to the server log instead of sending it.
 *
 * The default, and the right default: a development machine must not be able to
 * e-mail real guardians because someone ran the seed.
 */
export const consoleDriver: NotificationDriver = {
  name: "console",
  async send(message) {
    console.info(
      `[notification:console] ${message.channel} -> ${message.to}\n` +
        (message.subject ? `assunto: ${message.subject}\n` : "") +
        message.body
    );
  },
};
