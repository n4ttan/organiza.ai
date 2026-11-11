# MEMORY.md — organiza.ai

Lido no início de toda sessão. Atualize aqui, não re-explore o que já está registrado.

## Estado (2026-11-11)
- Repos criados: `n4ttan/organiza.ai` (público, Pages por workflow) e `n4ttan/organiza-dados` (privado: `inscricoes.json`, workflow `notificar` só `workflow_dispatch`, Secret `VAPID_PRIVATE_KEY`). Chave pública em `src/vapid-publica.js`.
- Fora do repo público (`.gitignore`): `docs/notas/` (dados pessoais) e `.claude/` (skills de terceiros, 44 MB). Só existem nesta máquina.
- **Fase 1A passou (2026-11-11):** push de teste chegou no iPhone com o app fechado (Apple respondeu 201; inscrição "Celular" em `inscricoes.json`; token fine-grained já colado no app). Portão liberado.
- **Fase 1B (2026-11-11):** `src/regras/lembretes.js` (`lembretesDoDia`, `mensagemPush`, `turnoDoEnvio`, `hojeEmBrasilia`; Vitest, `npm test`), `src/repositorio/github.js` (`lerDados`/`gravarDados` com `sha`, cache em `localStorage['dados_cache']`, base64 em UTF-8), `public/sw.js` à mão com cache rede-primeiro (sem `vite-plugin-pwa`: o app só abre offline depois de uma abertura online), `scripts/notificar.mjs <pasta> [--forcar]` (remove inscrição 404/410).
- `organiza-dados`: `dados.json` com a carga inicial (14 projetos, 19 pendências, 5 contas, 7 recorrentes; `Projeto` ganhou `horasTotal`/`horasFeitas` para o estágio). Workflow `notificar`: cron `5 * * * *` + `workflow_dispatch` (input `forcar`), `contents: write`, commita `inscricoes.json` quando remove inscrição.
- Push: só a hora cheia conta (minutos de `config.lembretes.horas` são ignorados). Primeiro horário do dia = resumo (atrasadas, hoje, D-7/3/1/0, fatura D-3/D-0); os outros = só o que vence amanhã. `--forcar` sem nada a lembrar não envia.
- Telas (`src/telas/`): Hoje, Faculdade, Projetos, Finanças na barra inferior; Ajustes pela engrenagem do topo. Aba inicial pelo hash (`#financas`). CSP `style-src 'self'`: proibido `style={{}}` inline (largura variável: `<progress>` ou SVG).
- **Redesign (2026-11-11):** preto/cinza escuro/verde, tokens em `src/index.css` (`@theme`) e regras em `DESIGN-RULES.md`. `design-taste-frontend` é kit de site de marketing, não serve para a UI do app.
- **Fase 2 (2026-11-11), feito:** `src/regras/financas.js` (`resumoDoMes`, `categorizar`, `faturaPadrao`, `formatarReais`, `centavosDe`), tela `Financas.jsx`, `FormularioFinancas.jsx` (lançamento e recorrente; opção de gravar regra em `config.regrasCategoria`), valor de fatura informado à mão em `conta.faturas[mes]`. Transação com `recorrenteId` ou categoria `pagamento-fatura` não entra nas somas. Importador em `src/regras/extrato.js` (`parseExtrato`, `parseLinhaValor`, `sugerirRecorrente`, `desduplicar`, `hashTransacao`) unifica Mercado Pago (Markdown e CSV release_report) e C6 Bank (CSV e texto), com dedup por hash, sugestão automática de recorrente por texto e categorização inteligente (41 testes passando no Vitest). Próximo: integrar interface do importador na aba Finanças.
- Captura de tela local: `~/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell --no-sandbox --screenshot` (o `chrome` completo trava no WSL); semear `localStorage` (`gh_token`, `dados_cache`) por uma página temporária.
- Falta verificar da seção 9 do plano: push real do JOSIF no iPhone, modo avião, conflito em dois aparelhos (`/impeccable critique` dispensado pelo usuário). Próximo: importador da Fase 2.
- `web-push` é v4 (ESM, sem export default: `import * as webpush`).
- Mercado Pago: `MP_TOKEN` em `.env` (nunca imprimir). `scripts/mp-relatorio.mjs` (o usuário roda: `! node --env-file=.env scripts/mp-relatorio.mjs`) cria a config, pede o `release_report` de 30 dias, salva em `docs/notas/mp-release-report.csv` (fora do git) e imprime só cabeçalho e contagem por tipo. Ainda não rodado; nomes de coluna e o campo `file_name` da lista vieram da documentação, não de teste. Ao ler o relatório, não mostrar valores.
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
