"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * BackButton - Botão "Voltar" padronizado
 * Sempre posicionado no canto superior esquerdo do conteúdo
 *
 * Uso:
 * - Com href: <BackButton href="/admin/dashboard" />
 * - Com router.back(): <BackButton /> (padrão)
 * - Com ação customizada: <BackButton onClick={() => {...}} />
 */
export default function BackButton({
  href,
  label = "Voltar",
  onClick,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  const buttonClasses = `
    inline-flex items-center gap-2
    px-4 py-2
    text-sm font-medium
    text-muted-foreground hover:text-foreground
    transition-colors
    rounded-lg
    hover:bg-muted
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={buttonClasses}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
