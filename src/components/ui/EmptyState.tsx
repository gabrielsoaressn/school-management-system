import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
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
export default function EmptyState({
  icon,
  title = "Nenhum item encontrado",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 text-muted-foreground">
        {icon || <Inbox className="h-12 w-12" />}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
