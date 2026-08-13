"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Printer, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  async function fetchDocument() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`);
      const data = await response.json();

      if (data.success) {
        setDocument(data.data);
      } else {
        toast.error("Documento não encontrado");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      toast.error("Erro ao carregar documento");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // The PDF is produced by the server from the same HTML shown here, so the
  // file the school hands over cannot differ from the record. The old button
  // downloaded raw HTML, which is not a document anyone can file.
  const pdfHref = `/api/admin/documents/${documentId}/pdf`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Actions Bar - Hidden on print */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <BackButton href="/admin/dashboard" />

          <div className="flex gap-2">
            <a href={pdfHref}>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </a>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        <div className="mx-auto max-w-5xl">
          <div
            className="bg-white shadow-lg print:shadow-none"
            dangerouslySetInnerHTML={{ __html: document?.generatedHtml || "" }}
          />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
