"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSent(true);
      } else {
        toast.error(data.error || "Não foi possível enviar o e-mail");
      }
    } catch {
      toast.error("Não foi possível enviar o e-mail");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthCard
        title="Verifique seu e-mail"
        description="Se este e-mail estiver cadastrado, enviamos um link para você criar uma nova senha. O link vale por 1 hora."
        footer={
          <Link href="/login" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Não recebeu? Confira a caixa de spam ou{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-primary hover:underline"
          >
            tente outro e-mail
          </button>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta e enviaremos um link para redefinir a senha."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoFocus
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
        </Button>
      </form>
    </AuthCard>
  );
}
