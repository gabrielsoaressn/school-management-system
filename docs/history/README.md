# Documentos históricos

Estes arquivos descrevem **intenções** de fases anteriores do projeto, não o
sistema como ele é hoje. Ficam aqui como registro de decisões e para explicar de
onde vieram certas escolhas.

Onde eles divergem do código, vale `docs/AUDIT.md`.

| Arquivo                     | O que é                                             | Por que não vale mais                                                                               |
| --------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `IMPLEMENTATION_SUMMARY.md` | relatório de conclusão dos "5 módulos avançados"    | declarava tudo pronto; na prática 8 páginas não compilavam e partes anunciadas não tinham interface |
| `MIGRATION_SUMMARY.md`      | resumo da migração de schema aplicada com `db push` | o schema mudou substancialmente nas fases 2 a 4, e agora há migrations versionadas                  |
| `SCHEMA_PROPOSAL.md`        | proposta original dos módulos                       | referencia models que foram removidos (`Tuition`, `Grade`, `Attendance`, `Discount`)                |
| `PM2_SETUP.md`              | instruções antigas de PM2                           | apontava para `/home/gab/Projects` e rodava `npm run dev`; ver `docs/DEPLOYMENT.md`                 |
