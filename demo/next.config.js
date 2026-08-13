const path = require("path");

/**
 * Build config da demo estática (GitHub Pages).
 *
 * O app real é server-side (Prisma, NextAuth, rotas de API) e não exporta como
 * site estático. Esta pasta é um segundo app Next — só telas, alimentadas por
 * `demo/lib/mock.ts` — que reaproveita os componentes de UI de `src/components`
 * e os tokens de design de `src/app/globals.css`, para a demo não divergir do
 * produto.
 *
 * O Pages serve o repositório em /<repo>, então os assets precisam desse
 * prefixo. Defina DEMO_BASE_PATH="" para servir na raiz de um domínio.
 *
 * @type {import('next').NextConfig}
 */
const basePath =
  process.env.DEMO_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/school-management-system" : "");

const nextConfig = {
  output: "export",
  basePath,
  // O Pages não reescreve URLs: /admin/dashboard/ resolve para index.html.
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

module.exports = nextConfig;
