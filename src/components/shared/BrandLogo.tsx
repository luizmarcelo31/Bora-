/**
 * Marca BoraMais — arte oficial em public/botao.svg.
 * Os usos (login, sidebar, header) atualizam juntos via BrandMark.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo local public/, sem remotePatterns
    <img src="/botao.svg" alt="" aria-hidden="true" className={className ? `${className} rounded-lg` : "rounded-lg"} />
  );
}
