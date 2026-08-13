import { ReactNode, isValidElement } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Either a rendered node or a lucide-react icon component. */
  icon?: ReactNode | LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState - Estado vazio elegante
 *
 * Exemplo:
 * <EmptyState
 *   title="Nenhum aluno encontrado"
 *   description="Comece cadastrando seu primeiro aluno"
 *   action={<Button>Novo Aluno</Button>}
 * />
 */
export function EmptyState({
  icon,
  title = "Nenhum item encontrado",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  // Accept both <Icon /> and Icon: a bare component is rendered at a fixed size.
  const IconComponent =
    typeof icon === "function" ? (icon as LucideIcon) : undefined;
  const iconNode = IconComponent ? (
    <IconComponent className="h-12 w-12" />
  ) : isValidElement(icon) ? (
    icon
  ) : (
    <Inbox className="h-12 w-12" />
  );

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`}
    >
      <div className="mb-4 text-muted-foreground">{iconNode}</div>

      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
