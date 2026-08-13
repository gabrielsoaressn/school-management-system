"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Paperclip, X } from "lucide-react";

export type DocumentSlot =
  "birthCertificate" | "cpf" | "proofOfAddress" | "previousSchool";

interface Props {
  slot: DocumentSlot;
  label: string;
  hint?: string;
  value: string | null;
  onChange: (key: string | null) => void;
}

/**
 * One optional document on the enrolment form.
 *
 * Uploads immediately and keeps only the returned key in form state, so a large
 * attachment never travels inside the JSON payload and a guardian who abandons
 * the form leaves nothing half-written in the database.
 */
export function DocumentUpload({ slot, label, hint, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSelect = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("slot", slot);
      body.append("file", file);

      const response = await fetch("/api/uploads/enrollment-documents", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (data.success) {
        onChange(data.data.key);
        setFileName(file.name);
        toast.success(`${label} anexado`);
      } else {
        toast.error(data.error || "Não foi possível enviar o arquivo");
      }
    } catch {
      toast.error("Não foi possível enviar o arquivo");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    onChange(null);
    setFileName(null);
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
          {value && fileName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <Check className="h-3 w-3" />
              <span className="truncate">{fileName}</span>
            </p>
          )}
        </div>

        {value ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remover ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <label className="shrink-0 cursor-pointer rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              {uploading ? "Enviando..." : "Anexar"}
            </span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleSelect(e.target.files?.[0])}
            />
          </label>
        )}
      </div>
    </div>
  );
}

export default DocumentUpload;
