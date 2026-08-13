import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

/**
 * Card - Container moderno com sombra sutil
 * Segue o design system: fundo branco, borda sutil, sombra leve
 */
export function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const hoverClasses = hover ? "transition-shadow hover:shadow-md" : "";

  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${paddingClasses[padding]} ${hoverClasses} ${className} `}
    >
      {children}
    </div>
  );
}

export default Card;
