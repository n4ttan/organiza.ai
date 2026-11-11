# MEMORY.md — organiza.ai

Lido no início de toda sessão. Atualize aqui, não re-explore o que já está registrado.

## Estado (2026-11-11)
- Sem código ainda. Feito: `git init` (sem commits), `.gitignore`, plano em `docs/notas/2026-11-11-plano.md`, viabilidade em `docs/notas/2026-11-11-viabilidade.md`.
- `gh` autenticado como `n4ttan`. Repos `n4ttan/organiza.ai` (público) e `n4ttan/organiza-dados` (privado) **ainda não criados**: falta o ok do usuário.
- Mercado Pago: `MP_TOKEN` de produção em `.env` (nunca imprimir). GETs da API de relatórios respondem em conta PF; falta criar a config (`POST /v1/account/release_report/config`) e gerar um relatório: **só com ok do usuário**. Ao ler o relatório, mostrar só cabeçalho e tipos de lançamento, não valores.
- Pendente do usuário: teste do Classroom (3 tentativas, na nota de viabilidade), CSVs de exemplo (extrato MP, fatura C6).
- Próximo passo de código: Fase 1A (push ponta a ponta no iPhone, iOS 18.7.8) antes de qualquer tela.

## Arquitetura (aprovada em 2026-11-11, não implementada) — detalhe em `docs/notas/2026-11-11-plano.md`
- PWA estática no GitHub Pages (repo público `n4ttan/organiza.ai`). React + Vite + Tailwind + `vite-plugin-pwa`. **Sem backend.**
- Dados: repo **privado** `n4ttan/organiza-dados` (`dados.json`, `inscricoes.json`), lido/gravado pelo app via API de Contents com token fine-grained (90 dias, só esse repo) guardado no `localStorage`.
- Notificações: Web Push (VAPID). Workflow cron no repo privado (07:30 e 19:00 BRT) faz checkout do público e roda `scripts/notificar.mjs`. Alvo: iPhone, instalado na tela inicial.
- Camadas do front: `src/repositorio/` (GitHub) · `src/regras/` (funções puras, compartilhadas com o script de push) · `src/telas/`.
- Sem banco. Finanças: só leitura/importação; C6 sem API (data fixa, vence dia 12); Mercado Pago vence dia 15, API de relatórios a testar.
- Portão: Fase 1A (push ponta a ponta no iPhone) antes de qualquer tela.

## Skills do projeto (`.claude/skills/`)
- `ui-ux-pro-max` — regras de design system; usar em todo frontend.
- `design-taste-frontend` (taste-skill) — anti-genérico; tokens em `DESIGN-RULES.md`.
- `caveman` — saída comprimida; ativo só em backend e orquestração de subagentes/tmux.
- `impeccable` (global) — `/impeccable critique <alvo>` para auditoria visual.

## Regras de sessão
- Ler `MEMORY.md` e `USER.md` primeiro; só então explorar.
- Frontend: aplicar taste + ui-ux-pro-max sem pedir permissão.
- Terminal: saída seca, só dado técnico.
