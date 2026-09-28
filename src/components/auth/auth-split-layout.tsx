import { BrandMark } from "@/components/shared/BrandMark";

/**
 * Layout split das telas de auth (Fase 2).
 * Esquerda: painel da marca. Direita: formulário.
 */
export function AuthSplitLayout({
  tagline,
  title,
  description,
  children,
  footer,
}: {
  tagline: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="hidden bg-[#435459] lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo local public/, sem remotePatterns */}
            <img src="/LOGO.svg" alt="BoraMais" className="mx-auto w-44 rounded-2xl shadow-lg" />
            <p className="text-xl text-white/80">{tagline}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-4 sm:p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-6 py-10 sm:space-y-8 sm:py-16">
          <div className="space-y-2 text-center">
            <BrandMark className="justify-center lg:hidden" />
            <div className="font-heading text-2xl font-semibold tracking-tight">{title}</div>
            <p className="mx-auto max-w-xl text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-4">
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
