"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadCompanyLogoAction } from "./actions";

/**
 * Upload do logo da empresa (Fase 3.3 — PDF com logo da loja).
 *
 * ## Por que é Client Component
 *
 * Precisa de `useState` para o estado de envio, e a página de Configurações é
 * Server Component. Componentizar separado resolve: a página continua server e
 * só este pedaço de formulário é client.
 *
 * ## Por que é form separado, e não mais um campo no de baixo
 *
 * `updateSettingsAction` faz `redirect()` no fim, e o arquivo precisa de
 * `enctype="multipart/form-data"` — que se aplica ao form inteiro. Dividir o
 * mesmo form faria salvar as preferências enviar o arquivo também, sem
 * necessidade, e a validação do `File` passaria a rodar em toda gravação de
 * preferência.
 *
 * ## Por que a URL deixou de ser campo
 *
 * O dono da loja não tem onde hospedar imagem, e o campo quase sempre ficava
 * vazio — ou seja, não tinha logo. A URL continua no banco como consequência
 * do upload porque o PDF é montado no browser e precisa dela sem consultar o
 * servidor.
 */
export function CompanyLogoField({ currentUrl }: { currentUrl: string | null }) {
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={async (fd: FormData) => {
        setEnviando(true);
        try {
          await uploadCompanyLogoAction(fd);
        } finally {
          setEnviando(false);
        }
      }}
      className="flex flex-col gap-2"
    >
      <span className="text-sm font-semibold">Logo da empresa</span>
      <p className="text-sm text-muted-foreground">
        Sai nos relatórios exportados, na impressão e no recibo do PDV. JPG ou PNG, até 512KB.
      </p>
      {currentUrl ? (
        <div className="flex items-center gap-3 rounded-md border border-border p-2">
          {/* `img` e não `next/image`: a URL é do Supabase Storage e o
              `next/image` exigiria configurar o hostname no next.config; para
              uma miniatura de 48px, o ganho não paga a configuração. */}
          <img src={currentUrl} alt="Logo atual da empresa" className="h-12 w-auto object-contain" />
          <span className="text-sm text-muted-foreground">Logo atual.</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma logo enviada. Os PDF saem sem logo.</p>
      )}
      <div className="flex items-center gap-2">
        <Input type="file" name="logo" accept="image/jpeg,image/png" required className="max-w-xs" />
        <Button type="submit" variant="outline" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar logo"}
        </Button>
      </div>
    </form>
  );
}
