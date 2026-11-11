# MEMORY.md — organiza.ai

Lido no início de toda sessão. Atualize aqui, não re-explore o que já está registrado.

## Estado (2026-11-11)
- Repos criados: `n4ttan/organiza.ai` (público, Pages por workflow) e `n4ttan/organiza-dados` (privado: `inscricoes.json`, workflow `notificar` só `workflow_dispatch`, Secret `VAPID_PRIVATE_KEY`). Chave pública em `src/vapid-publica.js`.
- Fora do repo público (`.gitignore`): `docs/notas/` (dados pessoais) e `.claude/` (skills de terceiros, 44 MB). Só existem nesta máquina.
- **Fase 1A passou (2026-11-11):** push de teste chegou no iPhone com o app fechado (Apple respondeu 201; inscrição "Celular" em `inscricoes.json`; token fine-grained já colado no app). Portão liberado.
- **Fase 1B (2026-11-11):** `src/regras/lembretes.js` (`lembretesDoDia`, `mensagemPush`, `turnoDoEnvio`, `hojeEmBrasilia`; Vitest, `npm test`), `src/repositorio/github.js` (`lerDados`/`gravarDados` com `sha`, cache em `localStorage['dados_cache']`, base64 em UTF-8), `public/sw.js` à mão com cache rede-primeiro (sem `vite-plugin-pwa`: o app só abre offline depois de uma abertura online), `scripts/notificar.mjs <pasta> [--forcar]` (remove inscrição 404/410).
- `organiza-dados`: `dados.json` com a carga inicial (14 projetos, 19 pendências, 5 contas, 7 recorrentes; `Projeto` ganhou `horasTotal`/`horasFeitas` para o estágio). Workflow `notificar`: cron `5 * * * *` + `workflow_dispatch` (input `forcar`), `contents: write`, commita `inscricoes.json` quando remove inscrição.
- Push: só a hora cheia conta (minutos de `config.lembretes.horas` são ignorados). Primeiro horário do dia = resumo (atrasadas, hoje, D-7/3/1/0, fatura D-3/D-0); os outros = só o que vence amanhã. `--forcar` sem nada a lembrar não envia.
- Telas (`src/telas/`): Hoje, Faculdade, Projetos, Ajustes. CSP `style-src 'self'`: proibido `style={{}}` inline.
- Falta verificar da seção 9 do plano: push real do JOSIF no iPhone, modo avião, conflito em dois aparelhos, `/impeccable critique`. Próximo: Fase 2 (finanças), depende dos CSVs de exemplo.
- `web-push` é v4 (ESM, sem export default: `import * as webpush`).
- Mercado Pago: `MP_TOKEN` em `.env` (nunca imprimir). Usuário autorizou os POSTs `release_report/config` e `release_report` (30 dias), mas o classificador de permissões do Claude Code bloqueou o POST; pendente de regra de permissão ou de o usuário rodar. Ao ler o relatório, mostrar só cabeçalho e tipos de lançamento, não valores.
- Pendente do usuário: teste do Classroom (3 tentativas, na nota de viabilidade), CSVs de exemplo (extrato MP, fatura C6).

## Arquitetura (aprovada em 2026-11-11) — detalhe em `docs/notas/2026-11-11-plano.md`
- PWA estática no GitHub Pages (repo público `n4ttan/organiza.ai`). React + Vite + Tailwind + `vite-plugin-pwa`. **Sem backend.**
- Dados: repo **privado** `n4ttan/organiza-dados` (`dados.json`, `inscricoes.json`), lido/gravado pelo app via API de Contents com token fine-grained (90 dias, só esse repo) guardado no `localStorage`.
- Notificações: Web Push (VAPID). Workflow cron de hora em hora no repo privado (horários em `config.lembretes`, padrão 07:30 e 19:00 BRT) faz checkout do público e roda `scripts/notificar.mjs`. Alvo: iPhone, instalado na tela inicial.
- Camadas do front: `src/repositorio/` (GitHub) · `src/regras/` (funções puras, compartilhadas com o script de push) · `src/telas/`.
- Sem banco. Finanças: só leitura/importação; C6 sem API (data fixa, vence dia 12); Mercado Pago vence dia 15, API de relatórios a testar.

## Skills do projeto (`.claude/skills/`)
- `ui-ux-pro-max` — regras de design system; usar em todo frontend.
- `design-taste-frontend` (taste-skill) — anti-genérico; tokens em `DESIGN-RULES.md`.
- `caveman` — saída comprimida; ativo só em backend e orquestração de subagentes/tmux.
- `impeccable` (global) — `/impeccable critique <alvo>` para auditoria visual.

## Regras de sessão
- Ler `MEMORY.md` e `USER.md` primeiro; só então explorar.
- Frontend: aplicar taste + ui-ux-pro-max sem pedir permissão.
- Terminal: saída seca, só dado técnico.
