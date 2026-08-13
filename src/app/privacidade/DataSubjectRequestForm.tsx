"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { HONEYPOT_FIELD } from "@/lib/rate-limit";

const REQUEST_TYPES = [
  { value: "ACCESS", label: "Acessar meus dados" },
  { value: "CORRECTION", label: "Corrigir dados incorretos" },
  { value: "DELETION", label: "Excluir dados" },
  { value: "PORTABILITY", label: "Portabilidade dos dados" },
];

export default function DataSubjectRequestForm() {
  const [form, setForm] = useState({
    type: "ACCESS",
    requesterName: "",
    requesterEmail: "",
    requesterCpf: "",
    studentName: "",
    description: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/data-subject-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [HONEYPOT_FIELD]: honeypot }),
      });

      const data = await response.json();

      if (data.success) {
        setProtocol(data.data.protocol);
      } else {
        toast.error(data.error || "Não foi possível registrar a solicitação");
      }
    } catch {
      toast.error("Não foi possível registrar a solicitação");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (protocol) {
    return (
      <Card padding="lg" className="border-success/30 bg-success/5">
        <h3 className="font-semibold text-foreground">
          Solicitação registrada
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu protocolo é{" "}
          <span className="font-semibold text-foreground">{protocol}</span>.
          Enviamos a confirmação por e-mail e responderemos em até 15 dias.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="O que você precisa?"
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          options={REQUEST_TYPES}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Seu nome completo"
            value={form.requesterName}
            onChange={(e) => update("requesterName", e.target.value)}
            required
          />
          <Input
            label="Seu e-mail"
            type="email"
            value={form.requesterEmail}
            onChange={(e) => update("requesterEmail", e.target.value)}
            required
          />
          <Input
            label="Seu CPF (opcional)"
            value={form.requesterCpf}
            onChange={(e) => update("requesterCpf", e.target.value)}
            helperText="Ajuda a localizar seu cadastro"
          />
          <Input
            label="Nome do aluno (se aplicável)"
            value={form.studentName}
            onChange={(e) => update("studentName", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Descreva o pedido
            <span className="ml-1 text-destructive">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            required
            minLength={10}
            className="w-full rounded-lg border border-input bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Explique quais dados e qual o motivo do pedido."
          />
        </div>

        <div className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor={`dsr-${HONEYPOT_FIELD}`}>Não preencha</label>
          <input
            id={`dsr-${HONEYPOT_FIELD}`}
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar solicitação"}
        </Button>
      </form>
    </Card>
  );
}
