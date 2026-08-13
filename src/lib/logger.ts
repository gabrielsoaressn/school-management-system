import pino from "pino";

/**
 * Structured logging.
 *
 * Every log line was a bare console.log, which in production means unparseable
 * text and, worse, occasional personal data printed in full. This gives one
 * logger with levels, JSON output for a log collector, and a redaction list so a
 * CPF or a token cannot be logged by accident.
 *
 *   LOG_LEVEL=debug|info|warn|error  (default: info, debug in development)
 */
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),
  // Redaction is not optional in a system holding minors' data: a stray
  // logger.info({ parent }) must not print a CPF.
  redact: {
    paths: [
      "password",
      "*.password",
      "*.cpf",
      "cpf",
      "token",
      "tokenHash",
      "*.tokenHash",
      "authorization",
      "req.headers.cookie",
      "req.headers.authorization",
    ],
    censor: "[redigido]",
  },
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

/** Child logger tagged with a subsystem, so lines can be filtered. */
export function loggerFor(subsystem: string) {
  return logger.child({ subsystem });
}
