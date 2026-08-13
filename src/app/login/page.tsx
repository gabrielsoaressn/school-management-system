"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Logo from "@/components/ui/logo";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Erro ao entrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="w-full max-w-md rounded-sm border border-gray-200 bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" showText={true} className="mb-4" />
          <p className="mt-2 text-gray-600">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 shadow-sm transition focus:border-gray-900 focus:outline-none focus:ring-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 shadow-sm transition focus:border-gray-900 focus:outline-none focus:ring-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-sm border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>

        {/* Seed credentials, useful in development and never shipped. */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Contas de teste (apenas em desenvolvimento)
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <p>
                <span className="font-semibold">Admin:</span> admin@davilla.com
              </p>
              <p>
                <span className="font-semibold">Financeiro:</span>{" "}
                staff3@davilla.com
              </p>
              <p>
                <span className="font-semibold">Secretaria:</span>{" "}
                staff2@davilla.com
              </p>
              <p>
                <span className="font-semibold">Professor:</span>{" "}
                professor1@davilla.com
              </p>
              <p>
                <span className="font-semibold">Responsável:</span>{" "}
                responsavel1@davilla.com
              </p>
              <p>
                <span className="font-semibold">Aluno:</span> aluno1@davilla.com
              </p>
              <p className="pt-1 text-gray-500">Senha de todas: password123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
