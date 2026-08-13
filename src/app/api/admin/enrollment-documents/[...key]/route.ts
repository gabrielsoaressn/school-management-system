import { withAuth } from "@/lib/api-auth";
import { notFound, serverError } from "@/lib/api-response";
import { readUpload } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

/**
 * GET /api/admin/enrollment-documents/<key> — serves an uploaded document.
 *
 * The only way to read an upload. Requires enrollment:read, records the access,
 * and tells proxies not to store it: these are a minor's identity documents.
 */
export const GET = withAuth<{ params: Promise<{ key: string[] }> }>(
  async (request, { params, user }) => {
    try {
      const { key } = await params;
      const objectKey = key.join("/");

      const object = await readUpload(objectKey);

      if (!object) {
        return notFound("Documento não encontrado");
      }

      await recordAudit({
        action: "enrollment_document.access",
        entity: "EnrollmentRequest",
        actor: user,
        request,
        after: { key: objectKey },
      });

      return new Response(new Uint8Array(object.body), {
        headers: {
          "Content-Type": object.contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      return serverError(error, "Erro ao abrir o documento");
    }
  },
  { permission: "enrollment:read" }
);
