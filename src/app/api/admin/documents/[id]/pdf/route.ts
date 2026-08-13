import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import { notFound, serverError } from "@/lib/api-response";
import { renderDocumentPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/datetime";
import { recordAudit } from "@/lib/audit";

/**
 * GET /api/admin/documents/[id]/pdf — the document as a PDF file.
 *
 * Generated on demand from the stored HTML rather than saved to disk: the file
 * always matches the record, there is nothing to keep in sync, and no document
 * containing a minor's data sits in a public directory.
 */
export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      const document = await prisma.generatedDocument.findUnique({
        where: { id },
        include: {
          student: {
            select: { firstName: true, lastName: true, studentId: true },
          },
          template: { select: { name: true } },
        },
      });

      if (!document) {
        return notFound("Documento não encontrado");
      }

      const studentName = `${document.student.firstName} ${document.student.lastName}`;
      const title = `${document.template.name} - ${studentName}`;

      const bytes = await renderDocumentPdf(document.generatedHtml, {
        title,
        footer: `${title} · emitido em ${formatDate(document.generatedAt)}`,
      });

      // Issuing a document about a student is an access worth recording.
      await recordAudit({
        action: "document.download",
        entity: "GeneratedDocument",
        entityId: document.id,
        actor: user,
        request,
        after: { format: "pdf", studentId: document.studentId },
      });

      const filename = `${document.type.toLowerCase()}-${document.student.studentId}.pdf`;

      return new Response(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          // Never cached by a proxy: it contains personal data.
          "Cache-Control": "private, no-store",
        },
      });
    } catch (error) {
      return serverError(error, "Erro ao gerar o PDF");
    }
  },
  { permission: "document:read" }
);
