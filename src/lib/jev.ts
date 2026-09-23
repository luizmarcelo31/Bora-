import { OpenRouter } from "@openrouter/sdk";
import type {
  DecisionsChoiceAnswer,
  DecisionsChoiceQuestion,
  DecisionsNoulAnswer,
  DecisionsNoulQuestion,
  DecisionsResponse,
  DecisionsScoreAnswer,
  DecisionsScoreQuestion,
} from "@openrouter/sdk/models";

/**
 * JEV (typesafe/jev) via OpenRouter Decisions API.
 * O modelo responde perguntas estreitas e tipadas sobre um `state`;
 * o workflow (o que fazer com as respostas) pertence ao nosso código.
 *
 * Uso server-side apenas: a key nunca pode ir para o client.
 */

export const JEV_DEFAULT_MODEL = "typesafe/jev-1.13";

export type JevQuestion =
  | DecisionsNoulQuestion
  | DecisionsChoiceQuestion
  | DecisionsScoreQuestion;

export type JevQuestions = Record<string, JevQuestion>;

export type JevState = string | Record<string, unknown> | unknown[];

export class JevError extends Error {
  constructor(
    message: string,
    public readonly cause_: unknown = undefined
  ) {
    super(message);
    this.name = "JevError";
  }
}

let cached: OpenRouter | null = null;

/** Client singleton. Lê OPENROUTER_API_KEY do env; falha cedo se ausente. */
export function getJevClient(): OpenRouter {
  if (cached) return cached;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new JevError("OPENROUTER_API_KEY não configurada");
  }
  cached = new OpenRouter({ apiKey });
  return cached;
}

/** Modelo JEV em uso (override via JEV_MODEL). */
export function jevModel(): string {
  return process.env.JEV_MODEL ?? JEV_DEFAULT_MODEL;
}

export function noulQuestion(
  instructions: string,
  criteria: { true: string; false: string }
): DecisionsNoulQuestion {
  return { type: "noul", instructions, criteria };
}

export function choiceQuestion(
  instructions: string,
  criteria: Record<string, string>
): DecisionsChoiceQuestion {
  return { type: "choice", instructions, criteria };
}

export function scoreQuestion(
  instructions: string,
  criteria: string[]
): DecisionsScoreQuestion {
  return { type: "score", instructions, criteria };
}

/**
 * Pergunta ao JEV e retorna as respostas tipadas.
 * Lança JevError em falha de rede, auth ou validação.
 */
export async function askJev(
  state: JevState,
  questions: JevQuestions,
  opts: { model?: string; sessionId?: string } = {}
): Promise<DecisionsResponse> {
  const client = getJevClient();
  try {
    return await client.alpha.decisions.create({
      decisionsRequest: {
        model: opts.model ?? jevModel(),
        state,
        questions,
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
      },
    });
  } catch (error) {
    throw new JevError("Falha na Decisions API", error);
  }
}

// Type guards para narrowing das respostas (discriminated union por `type`).
export function isNoulAnswer(
  a: DecisionsResponse["answers"][string]
): a is DecisionsNoulAnswer {
  return a.type === "noul";
}

export function isChoiceAnswer(
  a: DecisionsResponse["answers"][string]
): a is DecisionsChoiceAnswer {
  return a.type === "choice";
}

export function isScoreAnswer(
  a: DecisionsResponse["answers"][string]
): a is DecisionsScoreAnswer {
  return a.type === "score";
}
