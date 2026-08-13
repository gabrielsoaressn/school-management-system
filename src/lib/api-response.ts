import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Single response envelope for every API route.
 *
 *   success: { success: true,  data, message?, pagination? }
 *   failure: { success: false, error, details? }
 *
 * `message` carries user-facing pt-BR feedback for toasts; `error` carries the
 * failure reason. Clients must branch on `success`, never on the HTTP status
 * alone, and never on the shape of `data`.
 */

export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: ApiPagination;
}

export interface ApiErrorBody {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

interface OkOptions {
  message?: string;
  pagination?: ApiPagination;
  status?: number;
}

/**
 * Keys that must never reach a client, stripped from every success payload at
 * any depth. Creation endpoints used to return the new User row verbatim,
 * bcrypt hash included, which is enough for an offline attack on that account.
 */
const NEVER_SERIALIZE = new Set(["password", "tokenHash"]);

/** Prisma.Decimal without importing the client into this module. */
function isDecimal(value: object): boolean {
  return (
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function" &&
    "isZero" in value
  );
}

function serialize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => serialize(item)) as unknown as T;
  }

  if (value instanceof Date || value === null || typeof value !== "object") {
    return value;
  }

  // Decimal would otherwise reach the client as a string and turn `a + b` into
  // string concatenation. Money crosses the wire as a number, for display only.
  if (isDecimal(value as object)) {
    return (value as unknown as { toNumber(): number }).toNumber() as unknown as T;
  }

  const clean: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (NEVER_SERIALIZE.has(key)) continue;
    clean[key] = serialize(nested);
  }
  return clean as T;
}

const stripSecrets = serialize;

export function ok<T>(data: T, options: OkOptions = {}) {
  const { message, pagination, status = 200 } = options;
  const body: ApiSuccessBody<T> = { success: true, data: stripSecrets(data) };
  if (message) body.message = message;
  if (pagination) body.pagination = pagination;
  return NextResponse.json(body, { status });
}

export function created<T>(data: T, options: Omit<OkOptions, "status"> = {}) {
  return ok(data, { ...options, status: 201 });
}

interface PageInput {
  total: number;
  page: number;
  limit: number;
}

export function paginated<T>(
  data: T[],
  { total, page, limit }: PageInput,
  options: Omit<OkOptions, "pagination"> = {}
) {
  return ok(data, {
    ...options,
    pagination: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  });
}

export function fail(error: string, status = 400, details?: unknown) {
  const body: ApiErrorBody = { success: false, error };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function unauthorized(error = "Não autenticado") {
  return fail(error, 401);
}

export function forbidden(error = "Você não tem permissão para esta operação") {
  return fail(error, 403);
}

export function notFound(error = "Registro não encontrado") {
  return fail(error, 404);
}

export function validationFailed(error: ZodError, message = "Dados inválidos") {
  return fail(message, 400, error.flatten());
}

/**
 * Last-resort handler for unexpected exceptions: logs the real error and
 * returns a generic message, so internals never leak to the client.
 */
export function serverError(cause: unknown, error = "Erro interno do servidor") {
  console.error("[api]", error, cause);
  return fail(error, 500);
}
