import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Negócio opera em horário de SP: evita hidratação divergente (erro #441)
    // e limites de "hoje" errados quando o servidor roda em UTC (Vercel).
    if (!process.env.TZ) process.env.TZ = "America/Sao_Paulo";
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
