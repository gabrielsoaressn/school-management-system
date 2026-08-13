import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * O Tailwind procura o tailwind.config pelo diretório de trabalho, e o build da
 * demo roda da raiz (`next build demo`) — sem apontar o caminho, ele carregava
 * o config da raiz e não gerava nenhuma classe usada só em demo/.
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {
    tailwindcss: { config: join(here, "tailwind.config.ts") },
    autoprefixer: {},
  },
};

export default config;
