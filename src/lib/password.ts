import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";

export const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

/**
 * Passwords seen most often in Brazilian leaks plus the usual global suspects.
 * A short embedded list, checked case-insensitively — not a substitute for a
 * breach-corpus check, but it stops the passwords people actually pick.
 */
const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "senha123",
  "senha1234",
  "password",
  "password1",
  "password123",
  "qwerty123",
  "abc12345",
  "escola123",
  "aluno123",
  "professor",
  "professor123",
  "teacher123",
  "student123",
  "admin123",
  "administrador",
  "davilla123",
  "brasil123",
  "flamengo",
  "corinthians",
  "palmeiras",
  "iloveyou",
  "11111111",
  "00000000",
]);

export interface PasswordCheck {
  valid: boolean;
  errors: string[];
}

/**
 * Policy: at least 8 characters, not a known-common password, not derived from
 * the account's own e-mail, and not a single repeated character.
 */
export function validatePassword(
  password: string,
  context: { email?: string } = {}
): PasswordCheck {
  const errors: string[] = [];
  const value = password ?? "";

  if (value.length < PASSWORD_MIN_LENGTH) {
    errors.push(`A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }

  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    errors.push("Esta senha é muito comum. Escolha outra.");
  }

  if (/^(.)\1+$/.test(value)) {
    errors.push("A senha não pode ser um único caractere repetido");
  }

  const localPart = context.email?.split("@")[0]?.toLowerCase();
  if (localPart && localPart.length >= 4 && value.toLowerCase().includes(localPart)) {
    errors.push("A senha não pode conter o seu e-mail");
  }

  return { valid: errors.length === 0, errors };
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Random first-access password. Ambiguous glyphs (O/0, I/l/1) are left out so
 * it survives being read out loud at the front desk. The account is always
 * created with mustChangePassword, so this value is single-use by design.
 */
export function generateTemporaryPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  }
  return password;
}

/**
 * Reset tokens are stored hashed: a dump of PasswordResetToken cannot be
 * replayed to take over an account.
 */
export function createResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
