"use client";

import { Search, X } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onSearch: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounce?: number;
}

/**
 * SearchBar - Barra de busca moderna com ícone e botão de limpar
 *
 * Exemplo:
 * <SearchBar
 *   onSearch={(value) => console.log(value)}
 *   placeholder="Buscar alunos..."
 * />
 */
export default function SearchBar({
  onSearch,
  onClear,
  placeholder = "Buscar...",
  debounce = 300,
  className = "",
  ...props
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout for debounce
    const newTimeoutId = setTimeout(() => {
      onSearch(newValue);
    }, debounce);

    setTimeoutId(newTimeoutId);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full
          pl-10 pr-10 py-2
          bg-card
          border border-input
          rounded-lg
          text-foreground
          placeholder:text-muted-foreground
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
        `}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
