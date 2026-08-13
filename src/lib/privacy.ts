/**
 * Privacy notice shown wherever we collect personal data.
 *
 * CONSENT_VERSION is stored with every consent record: if the text changes, the
 * new version identifies who agreed to which wording. Bump it whenever
 * CONSENT_TEXT or the purposes below change in substance.
 */
export const CONSENT_VERSION = "2026-08-v1";

export const CONSENT_TEXT =
  "Autorizo a Escola D'Ávilla a tratar os dados pessoais informados neste " +
  "formulário, inclusive os do(a) aluno(a) menor de idade, para as " +
  "finalidades de análise e efetivação da matrícula, gestão acadêmica, " +
  "cobrança das mensalidades e cumprimento de obrigações legais. Declaro " +
  "estar ciente de que posso solicitar acesso, correção ou exclusão dos dados " +
  "a qualquer momento.";

export interface ProcessingPurpose {
  purpose: string;
  legalBasis: string;
  retention: string;
}

/** Purposes and legal bases, as published on /privacidade. */
export const PROCESSING_PURPOSES: ProcessingPurpose[] = [
  {
    purpose: "Análise e efetivação da matrícula",
    legalBasis:
      "Execução de contrato (LGPD art. 7º, V) e consentimento do responsável (art. 7º, I; art. 14, §1º)",
    retention: "Durante o vínculo escolar e por 5 anos após o encerramento",
  },
  {
    purpose: "Gestão acadêmica: notas, frequência e histórico escolar",
    legalBasis:
      "Execução de contrato (art. 7º, V) e obrigação legal de guarda do histórico (art. 7º, II)",
    retention: "Permanente, por exigência da legislação educacional",
  },
  {
    purpose: "Cobrança de mensalidades e emissão de documentos fiscais",
    legalBasis: "Execução de contrato (art. 7º, V) e obrigação legal (art. 7º, II)",
    retention: "5 anos após a quitação, conforme prazos fiscais",
  },
  {
    purpose: "Comunicação com o responsável (avisos, ocorrências, lembretes)",
    legalBasis: "Execução de contrato (art. 7º, V) e legítimo interesse (art. 7º, IX)",
    retention: "Durante o vínculo escolar",
  },
  {
    purpose: "Registro de auditoria de operações no sistema",
    legalBasis: "Cumprimento de obrigação legal e segurança da informação (art. 7º, II e art. 37)",
    retention: "5 anos",
  },
];

/** Contact for LGPD requests (art. 41). */
export const DATA_PROTECTION_CONTACT = {
  name: "Encarregado de Proteção de Dados - Escola D'Ávilla",
  email: "privacidade@davilla.com.br",
};
