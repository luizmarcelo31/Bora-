/**
 * Marca BoraMais — "B" geométrico em squircle tangerina.
 * SVG inline (sem request, herda tema via CSS vars quando monocromático).
 * Quando a logo oficial existir, trocar o conteúdo deste componente —
 * os usos (login, sidebar, header) atualizam juntos via BrandMark.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bm-gradient" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB9233" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#bm-gradient)" />
      <rect x="2" y="2" width="28" height="28" rx="9" fill="white" fillOpacity="0.08" />
      <path
        d="M11 8.5h6.5a4.25 4.25 0 0 1 0 8.5H11V8.5Z"
        stroke="white"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M11 17h7.5a4.25 4.25 0 0 1 0 8.5H11v-8.5Z"
        stroke="white"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="8" r="1.6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
