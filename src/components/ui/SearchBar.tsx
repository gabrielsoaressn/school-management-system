"use client";

import { Search, X } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";

interface SearchBarProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  /** Controlled value. When provided, the caller owns the state. */
  value?: string;
  /** Fires on every keystroke (controlled mode). */
  onChange?: (value: string) => void;
  /** Fires after `debounce` ms of inactivity, and on Enter. */
  onSearch?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounce?: number;
}

/**
 * SearchBar - Barra de busca com ícone e botão de limpar.
 *
 * Uncontrolled (debounced search):
 *   <SearchBar onSearch={(v) => setQuery(v)} placeholder="Buscar alunos..." />
 *
 * Controlled (caller owns the value):
 *   <SearchBar value={query} onChange={setQuery} onSearch={() => fetchList()} />
 */
export function SearchBar({
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  placeholder = "Buscar...",
  debounce = 300,
  className = "",
  ...props
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);

    if (!onSearch) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      onSearch(newValue);
    }, debounce);

    setTimeoutId(newTimeoutId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onSearch?.(value);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    onSearch?.("");
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-input bg-card py-2 pl-10 pr-10 text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0`}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
