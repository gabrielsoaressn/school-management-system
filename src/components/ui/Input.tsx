import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Input - Input moderno com label e validação
 *
 * Exemplo:
 * <Input
 *   label="Nome completo"
 *   placeholder="Digite seu nome..."
 *   error="Nome é obrigatório"
 * />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
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

        <input
          ref={ref}
          className={`
            w-full
            px-4 py-2
            bg-card
            border rounded-lg
            text-foreground
            placeholder:text-muted-foreground
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError ? "border-destructive" : "border-input"}
            ${className}
          `}
          {...props}
        />

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

Input.displayName = "Input";

export default Input;
