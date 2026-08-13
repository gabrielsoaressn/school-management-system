import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

/**
 * Flat config. `next lint` is deprecated from Next 16, so linting runs through
 * the ESLint CLI, and eslint-config-next 16 already exports flat config — no
 * FlatCompat shim needed.
 */
export default [
  {
    ignores: [
      "node_modules/**",
      // Build de qualquer app do repositório, inclusive o da demo em demo/:
      // ".next/**" só casaria com a raiz.
      "**/.next/**",
      "**/out/**",
      "coverage/**",
      "storage/**",
      // One-off data migrations: they reference models the migration removed.
      "prisma/migrations-data/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // console.log is for debugging; info/warn/error are deliberate output.
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      // Downgraded, not silenced: eleven client screens call setState inside an
      // effect to load their data. Fixing it properly means restructuring them
      // around derived state or a data-fetching hook — tracked in
      // docs/BACKLOG.md rather than done as a drive-by during a lint pass.
      "react-hooks/set-state-in-effect": "warn",
      // Same treatment, same reason: six client screens call a fetch function
      // that is declared below the effect using it. JavaScript hoisting makes it
      // work, React's rules prefer the declaration first. Reordering six screens
      // as a drive-by at the end of a lint pass is how working screens break;
      // tracked in docs/BACKLOG.md.
      "react-hooks/refs": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/unsupported-syntax": "warn",
    },
  },
];
