"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination - Componente de paginação moderno
 *
 * Exemplo:
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <div className="flex items-center gap-2 px-4">
        <span className="text-sm text-foreground font-medium">
          Página {currentPage}
        </span>
        <span className="text-sm text-muted-foreground">de</span>
        <span className="text-sm text-foreground font-medium">
          {totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
