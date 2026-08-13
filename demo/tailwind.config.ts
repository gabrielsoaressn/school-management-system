import path from "node:path";
import type { Config } from "tailwindcss";
import base from "../tailwind.config";

// Os globs de `content` são resolvidos a partir do diretório de trabalho, e o
// build roda da raiz do repositório — daí os caminhos absolutos.
const here = __dirname;
const root = path.join(here, "..");

/**
 * Mesmo tema do app — só o `content` muda, porque as telas da demo vivem aqui
 * e os componentes reaproveitados vivem em ../src/components.
 */
const config = {
  ...base,
  content: [
    path.join(here, "app/**/*.{ts,tsx}"),
    path.join(here, "components/**/*.{ts,tsx}"),
    path.join(here, "lib/**/*.{ts,tsx}"),
    path.join(root, "src/components/**/*.{ts,tsx}"),
  ],
} satisfies Config;

export default config;
