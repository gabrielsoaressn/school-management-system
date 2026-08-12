import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button - Componente de botão padronizado
 *
 * Variantes:
 * - primary: Azul sólido (ação principal da tela)
 * - secondary: Cinza claro (ações secundárias)
 * - outline: Borda apenas (cancelar, voltar)
 * - ghost: Sem fundo (ações sutis)
 * - destructive: Vermelho (excluir, remover)
 * - success: Verde (confirmar, aprovar)
 *
 * Regra UX: Apenas 1 botão primary por tela!
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-semibold
    rounded-lg
    transition-all
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-primary text-primary-foreground
      hover:bg-primary/90
      shadow-sm hover:shadow
    `,
    secondary: `
      bg-secondary text-secondary-foreground
      hover:bg-secondary/80
    `,
    outline: `
      border-2 border-border
      text-foreground
      hover:bg-muted
    `,
    ghost: `
      text-foreground
      hover:bg-muted
    `,
    destructive: `
      bg-destructive text-destructive-foreground
      hover:bg-destructive/90
      shadow-sm hover:shadow
    `,
    success: `
      bg-success text-success-foreground
      hover:bg-success/90
      shadow-sm hover:shadow
    `,
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export default Button;
