export type NotificationChannel = "EMAIL" | "WHATSAPP" | "SMS";

export interface OutboundMessage {
  channel: NotificationChannel;
  /** E-mail address or phone number, depending on the channel. */
  to: string;
  subject?: string;
  body: string;
}

export interface NotificationDriver {
  name: string;
  send(message: OutboundMessage): Promise<void>;
}
