import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge - Tag de status colorida
 *
 * Exemplo:
 * <Badge variant="success">Ativo</Badge>
 * <Badge variant="warning">Pendente</Badge>
 * <Badge variant="destructive">Inativo</Badge>
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    info: "bg-info/10 text-info border border-info/20",
    outline: "border border-border text-foreground",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center
        font-semibold
        rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;
