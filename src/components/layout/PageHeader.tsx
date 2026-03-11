import Logo from "@/components/ui/logo";
import { ReactNode } from "react";

interface PageHeaderProps {
  className?: string;
  children?: ReactNode;
}

/**
 * PageHeader - Header moderno e consistente
 * Usado em todas as páginas para manter consistência visual
 */
export default function PageHeader({ className = "", children }: PageHeaderProps) {
  return (
    <header className={`border-b border-border bg-card shadow-sm ${className}`}>
      <div className="container mx-auto px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" showText={true} />
          {children && (
            <div className="flex items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
