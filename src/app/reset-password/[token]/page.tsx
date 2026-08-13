"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mismatch = confirmation.length > 0 && password !== confirmation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmation) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message ?? "Senha redefinida com sucesso");
        router.push("/login");
      } else {
        toast.error(data.error || "Não foi possível redefinir a senha");
      }
    } catch {
      toast.error("Não foi possível redefinir a senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Criar nova senha"
      description={`Escolha uma senha com pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nova senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={PASSWORD_MIN_LENGTH}
          required
          autoFocus
        />

        <Input
          label="Confirme a nova senha"
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={mismatch ? "As senhas não coincidem" : undefined}
          required
        />

        <Button
          type="submit"
          disabled={isSubmitting || mismatch}
          className="w-full"
        >
          {isSubmitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </AuthCard>
  );
}
