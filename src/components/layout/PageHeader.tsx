import Logo from "@/components/ui/logo";
import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  /** When set, renders the page title block instead of the branded top bar. */
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  /** Extra content: action buttons on the right of either variant. */
  children?: ReactNode;
}

/**
 * PageHeader has two variants:
 *
 * - Branded top bar (no `title`): full-width bar with the logo. Render it
 *   *above* PageWrapper, as the topmost element of the page.
 * - Page title block (with `title`): icon + title + subtitle. Render it
 *   *inside* PageWrapper, as the first element of the content area.
 *
 * Both accept `children` as trailing actions.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  className = "",
  children,
}: PageHeaderProps) {
  if (title) {
    return (
      <div
        className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    );
  }

  return (
    <header className={`border-b border-border bg-card shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <Logo size="md" showText={true} />
          {children && (
            <div className="flex items-center gap-3">{children}</div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
