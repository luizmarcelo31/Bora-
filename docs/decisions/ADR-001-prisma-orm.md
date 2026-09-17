# ADR-001 — Prisma como ORM

**Data:** 17/09/2026 · **Status:** Aceita

## Contexto
PROJECT_FOUNDATION previa Drizzle; RECOMENDACOES_FINAIS propôs Prisma (setup −80%, schema −50%, migrations automáticas).

## Decisão
Prisma 6 + `prisma/schema.prisma` + migrations versionadas.

## Consequências
- `npx prisma migrate dev` obrigatório para mudar schema.
- Raw SQL só em exceção, documentado.
- Trocar de ORM exige novo ADR.
