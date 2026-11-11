# DESIGN-RULES.md — config do taste-skill / ui-ux-pro-max

Dark minimalista, alto contraste. Aplicar sem pedir permissão.

## Cor
- Preto, cinza escuro e verde (pedido do Nattan em 2026-11-11). Tokens em `src/index.css` (`@theme`): `fundo #0a0a0a`, `painel #141414`, `relevo #1f1f1f`, `linha #262626`, `tinta #fafafa`, `apagado #a3a3a3`, `verde #4ade80` (único acento), `alerta #f87171` (só atraso e erro). Usar as classes dos tokens (`bg-painel`, `text-verde`), nunca `zinc-*`/`amber-*` nem hex solto.
- Contraste mínimo WCAG AA (4.5:1 texto, 3:1 UI). Um único acento. Sem gradiente decorativo.

## Espaçamento (grade de 4px; use só estes)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (Tailwind: 1 2 3 4 6 8 12 16). Nada fora da escala.

## Tipografia (razão 1.25, base 16px)
`12 · 14 · 16 · 20 · 24 · 30 · 36 · 48` (48 só no número de destaque). Números sempre `tabular-nums`. Pesos: 400, 500, 600. Line-height 1.5 corpo, 1.2 títulos.

## Geral
- Raios: 16px em cartões e listas agrupadas, 12px em campos e botões, círculo em botão de ícone e etiqueta. Bordas 1px `linha`. Sem sombras pesadas.
- Listas agrupadas num cartão com divisórias (`lista` em `src/telas/comum.jsx`), não uma caixa por item. Componentes prontos em `comum.jsx`: `Cabecalho`, `Secao`, `Etiqueta`, `Vazio`, `botao`, `campo`.
- Foco visível, alvos ≥ 44px, `prefers-reduced-motion` respeitado.
- Sem emoji como ícone; um conjunto de ícones só.
