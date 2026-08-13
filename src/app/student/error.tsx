"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

/**
 * Root error boundary.
 *
 * Without one, an exception in any page shows Next's default screen — in
 * production a blank page with no way back. This gives the user a way out and
 * reports the digest, which is what correlates their screenshot with the server
 * log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side errors never reach the server logger on their own.
    console.error("[client]", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </span>

        <h1 className="text-xl font-semibold text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A página não pôde ser carregada. Você pode tentar novamente; se o
          problema continuar, informe o código abaixo à equipe.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            código: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => window.location.assign("/")}>
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
}
