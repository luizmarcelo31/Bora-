import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (Next 16 — substitui o antigo middleware.ts).
 * - Atualiza a sessão do Supabase em toda requisição.
 * - Protege páginas privadas (/dashboard, /admin, /pdv...).
 * - APIs (/api/*) passam direto: authz é verificada por rota.
 */
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.reset) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 5000) {
      const oldest = rateBuckets.keys().next();
      if (!oldest.done) rateBuckets.delete(oldest.value);
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit básico só para APIs (páginas e assets passam direto).
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Muitas requisições. Tente em instantes." }, { status: 429 });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico";

  if (!user && !isPublicPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
