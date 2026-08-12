import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

/**
 * Select - Dropdown padronizado
 *
 * Exemplo:
 * <Select
 *   label="Série"
 *   options={[
 *     { value: "1", label: "1º Ano" },
 *     { value: "2", label: "2º Ano" }
 *   ]}
 * />
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      className = "",
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={`
            w-full
            px-4 py-2
            bg-card
            border rounded-lg
            text-foreground
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError ? "border-destructive" : "border-input"}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export default Select;
