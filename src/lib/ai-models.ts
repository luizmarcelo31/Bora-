/**
 * Configuração de modelos de IA para o Bora-
 * Lista de modelos disponíveis — troque o modelo padrão via env AI_DEFAULT_MODEL
 */

export interface AiModel {
  id: string
  name: string
  provider: "google" | "openai" | "anthropic"
  description: string
}

/**
 * Modelos disponíveis no projeto Bora-
 * Adicione novos modelos aqui conforme necessário.
 */
export const AI_MODELS: AiModel[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    description: "Modelo rápido e equilibrado da Google — ideal para tarefas cotidianas de PDV e atendimento.",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    description: "Versão mais recente do Flash — recomendado pela Google para novas integrações.",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Modelo estável e testado — fallback confiável.",
  },
]

/**
 * Modelo ativo — definido via env AI_DEFAULT_MODEL (default: gemini-3.7-flash)
 */
export const AI_DEFAULT_MODEL =
  process.env.AI_DEFAULT_MODEL || "gemini-3.7-flash"

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

/**
 * Retorna o modelo ativo da lista
 */
export function getAiModel(id?: string): AiModel {
  const modelId = id || AI_DEFAULT_MODEL
  return AI_MODELS.find((m) => m.id === modelId) ?? AI_MODELS[0]
}
