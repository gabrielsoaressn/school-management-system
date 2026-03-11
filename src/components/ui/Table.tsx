import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Table - Sistema de tabela padronizado e moderno
 *
 * Exemplo de uso:
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Nome</TableHead>
 *       <TableHead>Email</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow hover>
 *       <TableCell>João</TableCell>
 *       <TableCell>joao@email.com</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: TableHeaderProps) {
  return (
    <thead className={`bg-muted ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: TableBodyProps) {
  return (
    <tbody className={`bg-card divide-y divide-border ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  hover = false,
  selected = false,
}: TableRowProps) {
  const hoverClass = hover ? "hover:bg-muted/50 transition-colors" : "";
  const selectedClass = selected ? "bg-muted/50" : "";

  return (
    <tr className={`${hoverClass} ${selectedClass} ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: TableHeadProps) {
  return (
    <th
      className={`
        px-4 py-3
        text-left text-xs font-semibold
        text-foreground
        uppercase tracking-wider
        ${className}
      `}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-4 py-3 text-sm text-foreground ${className}`}>
      {children}
    </td>
  );
}
