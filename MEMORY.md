# MEMORY.md — organiza.ai

Lido no início de toda sessão. Atualize aqui, não re-explore o que já está registrado.

## Estado (2026-11-11)
- Repos criados: `n4ttan/organiza.ai` (público, Pages por workflow) e `n4ttan/organiza-dados` (privado: `inscricoes.json`, workflow `notificar` só `workflow_dispatch`, Secret `VAPID_PRIVATE_KEY`). Chave pública em `src/vapid-publica.js`.
- Fora do repo público (`.gitignore`): `docs/notas/` (dados pessoais) e `.claude/` (skills de terceiros, 44 MB). Só existem nesta máquina.
- Fase 1A no ar: app mínimo (`public/sw.js` e `manifest.webmanifest` à mão, sem `vite-plugin-pwa` ainda; botão em `src/App.jsx`; `src/repositorio/github.js`; `scripts/notificar.mjs` envia push de teste). **Aguardando o teste no iPhone**: nenhuma tela antes de passar.
- `web-push` é v4 (ESM, sem export default: `import * as webpush`).
- Mercado Pago: `MP_TOKEN` em `.env` (nunca imprimir). Usuário autorizou os POSTs `release_report/config` e `release_report` (30 dias), mas o classificador de permissões do Claude Code bloqueou o POST; pendente de regra de permissão ou de o usuário rodar. Ao ler o relatório, mostrar só cabeçalho e tipos de lançamento, não valores.
- Pendente do usuário: teste do Classroom (3 tentativas, na nota de viabilidade), CSVs de exemplo (extrato MP, fatura C6).

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
