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
export function PageWrapper({
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

  // No background or min-height: AppShell owns the page frame. This is only a
  // width constraint, so it can nest without doubling padding.
  return (
    <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
}

export default PageWrapper;
