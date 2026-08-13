import { withoutAuth } from "@/lib/api-auth";
import { created, fail, serverError } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  MAX_UPLOAD_BYTES,
  UnsupportedFileError,
  storeUpload,
} from "@/lib/storage";

const ALLOWED_SLOTS = [
  "birthCertificate",
  "cpf",
  "proofOfAddress",
  "previousSchool",
] as const;

/**
 * POST /api/uploads/enrollment-documents — public, for the enrolment form.
 *
 * Public because the guardian has no account yet: the whole point of the form is
 * that it precedes one. Rate limited per address, restricted to four known slots
 * and to PDF/JPG/PNG/WEBP up to 8 MB, and it returns only an opaque key. The file
 * itself is readable only through the authenticated download route.
 */
export const POST = withoutAuth(async (request) => {
  try {
    const limited = rateLimit(`upload:${clientIp(request)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!limited.allowed) {
      return fail("Muitos envios. Tente novamente mais tarde.", 429);
    }

    const form = await request.formData();
    const slot = String(form.get("slot") ?? "");
    const file = form.get("file");

    if (!ALLOWED_SLOTS.includes(slot as (typeof ALLOWED_SLOTS)[number])) {
      return fail("Tipo de documento inválido");
    }

    if (!(file instanceof File)) {
      return fail("Nenhum arquivo enviado");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return fail("O arquivo deve ter até 8 MB");
    }

    const stored = await storeUpload(`enrollment/${slot}`, {
      name: file.name,
      type: file.type,
      bytes: Buffer.from(await file.arrayBuffer()),
    });

    return created(
      { key: stored.key, size: stored.size },
      { message: "Documento enviado" }
    );
  } catch (error) {
    if (error instanceof UnsupportedFileError) {
      return fail(error.message);
    }
    return serverError(error, "Erro ao enviar o documento");
  }
});
