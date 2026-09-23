/**
 * Smoke test da integração JEV (OpenRouter Decisions API).
 *
 * Uso:
 *   OPENROUTER_API_KEY=sk-or-v1-... node scripts/jev-smoke.mjs
 *
 * A key NUNCA é escrita em arquivo — vem só do ambiente.
 * Reproduz o exemplo canônico: noul + choice + score sobre um state.
 */
import { OpenRouter } from "@openrouter/sdk";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY não definida no ambiente.");
  process.exit(1);
}

const model = process.env.JEV_MODEL ?? "typesafe/jev-1.13";
const openrouter = new OpenRouter({ apiKey });

let decision;
try {
  decision = await openrouter.alpha.decisions.create({
    decisionsRequest: {
      model,
      state: "Help! My payouts have been failing for 3 days.",
      questions: {
        is_urgent: {
          type: "noul",
          instructions: "Does this message convey urgency?",
          criteria: {
            true: "Explicitly time-sensitive",
            false: "No urgency expressed",
          },
        },
        department: {
          type: "choice",
          instructions: "Which team should handle this?",
          criteria: {
            billing: "Payments, invoicing, refunds",
            technical: "Bugs, outages, integrations",
            sales: "Pricing, upgrades, new accounts",
          },
        },
        frustration: {
          type: "score",
          instructions: "How frustrated is the customer?",
          criteria: ["Calm", "Frustrated", "Very angry"],
        },
      },
    },
  });
} catch (error) {
  console.error("Decisions API falhou:", String(error).slice(0, 2000));
  process.exit(1);
}

const { is_urgent, department, frustration } = decision.answers;
console.log("model:", decision.model, "| provider:", decision.provider ?? "?");
console.log("usage:", JSON.stringify(decision.usage));

let ok = true;
if (is_urgent?.type === "noul") {
  console.log("is_urgent.noul =", is_urgent.noul);
  if (!(is_urgent.noul >= 0 && is_urgent.noul <= 1)) ok = false;
} else {
  console.log("is_urgent RESPOSTA INESPERADA:", JSON.stringify(is_urgent));
  ok = false;
}

if (department?.type === "choice") {
  console.log("department.choice =", department.choice);
  console.log("department.probabilities =", JSON.stringify(department.probabilities));
  if (!["billing", "technical", "sales"].includes(department.choice)) ok = false;
} else {
  console.log("department RESPOSTA INESPERADA:", JSON.stringify(department));
  ok = false;
}

if (frustration?.type === "score") {
  console.log("frustration.score =", frustration.score);
  if (typeof frustration.score !== "number") ok = false;
} else {
  console.log("frustration RESPOSTA INESPERADA:", JSON.stringify(frustration));
  ok = false;
}

// Regra de negócio do exemplo: urgente + billing => escalar.
if (is_urgent?.type === "noul" && department?.type === "choice") {
  if (is_urgent.noul > 0.8 && department.choice === "billing") {
    console.log("AÇÃO: escalateToBilling(...)");
  } else {
    console.log("AÇÃO: fluxo normal (sem escalação)");
  }
}

if (!ok) {
  console.error("SMOKE FALHOU: formato de resposta fora do esperado.");
  process.exit(1);
}
console.log("SMOKE OK");
