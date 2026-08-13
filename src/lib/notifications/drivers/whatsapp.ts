import type { NotificationDriver } from "../types";

/**
 * WhatsApp is not implemented, and says so.
 *
 * Sending on WhatsApp requires an approved Business API account and message
 * templates pre-approved by Meta — a commercial step, not a coding one. Until the
 * school has that, this logs the message and reports itself as a stub, so the
 * collection screen records the attempt honestly instead of claiming delivery.
 *
 * To implement: replace with a call to the Cloud API
 * (POST /v22.0/{phone-number-id}/messages) using an approved template, and read
 * WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID from the environment.
 */
export const whatsappDriver: NotificationDriver = {
  name: "whatsapp-stub",
  async send(message) {
    console.info(
      `[notification:whatsapp-stub] NÃO ENVIADO (driver não implementado) -> ${message.to}\n` +
        message.body
    );
  },
};
