import type { Metadata } from "next";
// Os tokens de design são os do app — a demo não mantém uma cópia da paleta.
import "../../src/app/globals.css";

export const metadata: Metadata = {
  title: "D'Ávilla — Demo do Sistema de Gestão Escolar",
  description:
    "Demonstração navegável, com dados fictícios, dos quatro portais do sistema: administração, professor, responsável e aluno.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      {/* O app usa next/font; aqui a pilha do sistema evita buscar a fonte no
          build, que roda sem rede garantida no CI do Pages. */}
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
