"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";

/**
 * Password change for the logged-in user, and the only way out of a forced
 * first-access change: the middleware holds those accounts here until
 * mustChangePassword is cleared.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const forced = session?.user?.mustChangePassword === true;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mismatch = confirmation.length > 0 && newPassword !== confirmation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmation) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message ?? "Senha alterada com sucesso");
        // Refresh the token so mustChangePassword stops gating navigation.
        await update();
        router.push("/");
        router.refresh();
      } else {
        toast.error(data.error || "Não foi possível alterar a senha");
      }
    } catch {
      toast.error("Não foi possível alterar a senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={forced ? "Defina sua senha" : "Alterar senha"}
      description={
        forced
          ? "Sua conta foi criada com uma senha provisória. Escolha uma senha pessoal para continuar."
          : `Escolha uma senha com pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
      }
      footer={
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:text-foreground"
        >
          Sair da conta
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={forced ? "Senha provisória" : "Senha atual"}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Nova senha"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={PASSWORD_MIN_LENGTH}
          required
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
          {isSubmitting ? "Salvando..." : "Salvar senha"}
        </Button>
      </form>
    </AuthCard>
  );
}
