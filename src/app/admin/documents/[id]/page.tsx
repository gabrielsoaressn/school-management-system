'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Printer, Download } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`);
      const data = await response.json();

      if (data.success) {
        setDocument(data.data);
      } else {
        toast.error('Documento não encontrado');
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Criar elemento temporário para download
    const element = document.createElement('a');
    const file = new Blob([document.generatedHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `documento-${documentId}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Documento baixado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Actions Bar - Hidden on print */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BackButton href="/admin/dashboard" />

          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Baixar HTML
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        <div className="max-w-5xl mx-auto">
          <div
            className="bg-white shadow-lg print:shadow-none"
            dangerouslySetInnerHTML={{ __html: document?.generatedHtml || '' }}
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
