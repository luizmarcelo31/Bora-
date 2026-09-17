# ADR-002 — Storage no MVP

**Data:** 17/09/2026 · **Status:** Aceita

## Contexto
PROJECT_FOUNDATION previa ImageKit; STACK_COMPARACAO propôs Supabase Storage no MVP.

## Decisão
MVP usa Supabase Storage (`Product.imageUrl` guarda a URL). ImageKit só com volume que justifique CDN/transformações.

## Consequências
- Upload via Supabase (bucket por tenant) — a implementar no módulo Operação.
- Credenciais de storage nunca no frontend.
