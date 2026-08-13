import { SelectHTMLAttributes, forwardRef, useId } from "react";

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
    // Same fix as Input: the label needs htmlFor to actually label the control.
    const generatedId = useId();
    const selectId = props.id ?? generatedId;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          aria-invalid={hasError || undefined}
          className={`w-full rounded-lg border bg-card px-4 py-2 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? "border-destructive" : "border-input"} ${className} `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}

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
