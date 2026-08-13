import { config } from "dotenv";

/**
 * Tests that touch the database read DATABASE_URL from .env, the same file the
 * Prisma CLI uses. Nothing else is loaded: a test must not pick up a production
 * NEXTAUTH_SECRET or a live SMTP driver by accident.
 */
config({ path: ".env", quiet: true });

process.env.NOTIFICATION_DRIVER = "console";
process.env.STORAGE_DRIVER = "local";
