# DESIGN-RULES.md — config do taste-skill / ui-ux-pro-max

Dark minimalista, alto contraste. Aplicar sem pedir permissão.

## Cor
- Fundo: `#0f172a` (página) e `zinc-900` (superfícies). Texto: `zinc-50` / `zinc-400` (secundário).
- Contraste mínimo WCAG AA (4.5:1 texto, 3:1 UI). Um único acento. Sem gradiente decorativo.

## Espaçamento (grade de 4px; use só estes)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (Tailwind: 1 2 3 4 6 8 12 16). Nada fora da escala.

## Tipografia (razão 1.25, base 16px)
`12 · 14 · 16 · 20 · 24 · 30 · 36`. Máx. 3 tamanhos por tela. Pesos: 400, 500, 600. Line-height 1.5 corpo, 1.2 títulos.

## Geral
- Raio único (8px). Bordas 1px `zinc-800`. Sem sombras pesadas.
- Foco visível, alvos ≥ 44px, `prefers-reduced-motion` respeitado.
- Sem emoji como ícone; um conjunto de ícones só.
