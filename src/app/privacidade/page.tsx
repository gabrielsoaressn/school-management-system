import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import {
  CONSENT_VERSION,
  DATA_PROTECTION_CONTACT,
  PROCESSING_PURPOSES,
} from "@/lib/privacy";
import DataSubjectRequestForm from "./DataSubjectRequestForm";

export const metadata: Metadata = {
  title: "Aviso de Privacidade - D'Ávilla",
  description:
    "Como a Escola D'Ávilla trata os dados pessoais de alunos e responsáveis, e como exercer seus direitos.",
};

const RIGHTS = [
  "Confirmar se tratamos seus dados e obter acesso a eles",
  "Corrigir dados incompletos, inexatos ou desatualizados",
  "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários",
  "Solicitar a portabilidade dos dados a outro prestador de serviço",
  "Revogar o consentimento, quando o tratamento se basear nele",
  "Ser informado sobre com quem compartilhamos seus dados",
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 lg:px-6">
          <Logo size="md" showText={true} />
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-foreground">
          Aviso de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versão {CONSENT_VERSION} · Lei nº 13.709/2018 (LGPD)
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            A Escola D'Ávilla trata dados pessoais de alunos, responsáveis e
            funcionários para prestar o serviço educacional e cumprir suas
            obrigações legais. Este aviso explica quais dados usamos, com que
            finalidade, com que base legal e por quanto tempo.
          </p>
          <p>
            Dados de crianças e adolescentes são tratados no seu melhor
            interesse, com o consentimento do responsável legal, conforme o
            artigo 14 da LGPD.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">
            Finalidades, bases legais e prazos
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="border border-border p-3 font-semibold">
                    Finalidade
                  </th>
                  <th className="border border-border p-3 font-semibold">
                    Base legal
                  </th>
                  <th className="border border-border p-3 font-semibold">
                    Retenção
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROCESSING_PURPOSES.map((item) => (
                  <tr key={item.purpose} className="align-top">
                    <td className="border border-border p-3">{item.purpose}</td>
                    <td className="border border-border p-3 text-muted-foreground">
                      {item.legalBasis}
                    </td>
                    <td className="border border-border p-3 text-muted-foreground">
                      {item.retention}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">
            Seus direitos
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {RIGHTS.map((right) => (
              <li key={right} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{right}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Responderemos em até 15 dias. Pedidos de exclusão são analisados
            frente aos prazos legais de guarda: histórico escolar e documentos
            fiscais não podem ser eliminados antes do prazo previsto em lei.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">
            Solicitar acesso, correção ou exclusão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha o formulário abaixo. Você receberá um número de protocolo
            por e-mail. Também é possível escrever direto para{" "}
            <a
              href={`mailto:${DATA_PROTECTION_CONTACT.email}`}
              className="text-primary hover:underline"
            >
              {DATA_PROTECTION_CONTACT.email}
            </a>
            .
          </p>

          <div className="mt-6">
            <DataSubjectRequestForm />
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-base font-semibold text-foreground">
            Encarregado de Proteção de Dados
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {DATA_PROTECTION_CONTACT.name} ·{" "}
            <a
              href={`mailto:${DATA_PROTECTION_CONTACT.email}`}
              className="text-primary hover:underline"
            >
              {DATA_PROTECTION_CONTACT.email}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
