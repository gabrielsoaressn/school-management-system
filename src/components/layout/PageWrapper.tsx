import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

/**
 * PageWrapper - Container padronizado para conteúdo de páginas
 * Fornece spacing consistente e responsividade
 */
export default function PageWrapper({
  children,
  maxWidth = "2xl",
  className = "",
}: PageWrapperProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-background">
      <main className={`container mx-auto px-4 lg:px-6 py-6 lg:py-8 ${maxWidthClasses[maxWidth]} ${className}`}>
        {children}
      </main>
    </div>
  );
}
