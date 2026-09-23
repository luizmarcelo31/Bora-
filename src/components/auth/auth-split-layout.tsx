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
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <BrandMark
              inverted
              className="justify-center text-primary-foreground [&_span:last-child]:text-5xl [&_span:last-child]:font-light"
            />
            <p className="text-primary-foreground/80 text-xl">{tagline}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-8 py-16">
          <div className="space-y-2 text-center">
            <div className="font-heading text-2xl font-bold tracking-tight">{title}</div>
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
