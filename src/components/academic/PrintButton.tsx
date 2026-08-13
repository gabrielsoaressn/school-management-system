"use client";

import { Printer } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * Print / save as PDF.
 *
 * The browser's print dialog is the export: it produces a real PDF, respects the
 * print stylesheet, and needs no server-side rendering pipeline.
 */
export function PrintButton({ label = "Imprimir / salvar PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

export default PrintButton;
