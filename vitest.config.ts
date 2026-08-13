import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the "@/*" paths from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Timezone-sensitive logic is the point of several tests: pin the zone so a
    // machine in another region gets the same results as CI.
    env: {
      TZ: "America/Sao_Paulo",
    },
    // tests/ talks to a real Postgres (see docs/OPERATIONS.md); src/ is pure.
    setupFiles: ["tests/setup.ts"],
  },
});
