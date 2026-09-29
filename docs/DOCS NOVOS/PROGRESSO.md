# Progresso — specs mobile (atualizado: sessão de hoje)

## Feito e validado (tsc + lint + testes + build verdes, 136 testes)

| Tarefa | Entrega | Testes |
|---|---|---|
| T1 | `pointer-coarse` 44px em `ui/button.tsx` (CSS emitido confirmado) | — |
| T2 | `ui/app-sheet.tsx`, `form-sheet.tsx`, `confirm-sheet.tsx` + `dashboard/sheets-test` (remover antes de entregar) | `ui/sheets.test.tsx` (4) |
| T3 | `components/forms/`: field, money-input, quantity-stepper, chip-select, date-field, barcode-field; hook em `hooks/` | `forms.test.tsx` (5, máscara inclusa) |
| E0 | `lib/pdv-math.ts` + tela consome funções | `pdv-math.test.ts` (10, 11 casos da spec) |
| V1 | `use-long-press` + `press-product-button` + badge + buzz + touch-manipulation | hook (3) + botão (3) |
| E1 | `_lib/use-express-sale.ts` + `_components/express-shell.tsx` (z-60, ✕, trava scroll) | — |
| E2 | `scan-bar`, `product-tiles`, top-24/30d, categorias, warnings persistentes | `express-e2.test.tsx` (3) |
| E3 | `last-item-strip`, `ticket-sheet`, `quantity-sheet`, desfazer via toast | `express-e3.test.tsx` (4) |
| Infra | RTL + jsdom + jest-dom, `vitest.config.ts` (alias `@`, exclui e2e), matchMedia stub | — |

## Próximo (nesta ordem)

| # | Tarefa | Pronto quando (resumo) |
|---|---|---|
| E4 | Cobrança: checkout-sheet, split-panel, discount-sheet, cédulas `suggestBills`, `MoneyInput` no recebido | N+3/N+2 no celular; RECEBER com motivo; sem `<details>` |
| E5 | `sale-done-screen`, NOVA VENDA, auto-fecha sem troco | Troco gigante parado; próxima venda em 1 toque |
| E6 | Rascunho `sessionStorage`, espera (máx 3), ConfirmSheet ao sair | Reload restaura; ✕ protege |
| E7 | Câmera (só com BarcodeDetector) + vibração/som | Testado em Android real |
| T4 | Editar produto em FormSheet (**parar e mostrar**) | Salvar no rodapé; foto junto; mesma action |
| T5–T11 | Lista, cadastro sheet, migração dialogs, detalhe, CRUD, compra/inventário/carrinho | um por sessão |

## Apagar antes de entregar
- `src/app/dashboard/sheets-test/` (página de teste T2)

## Não testado (exige device real)
Long-press, vibração, bip de leitor, 360/390/430, teclado aberto, Voltar Android, dark mode, prefers-reduced-motion em aparelho.
