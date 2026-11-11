// Baixa o relatório "Liberações" (release_report) do Mercado Pago dos últimos 30 dias.
// Somente leitura de dinheiro: os dois POSTs criam a configuração do relatório e pedem a geração dele.
// Uso: node --env-file=.env scripts/mp-relatorio.mjs
// Salva o CSV em docs/notas/ (fora do git) e imprime só cabeçalho e tipos de lançamento, nunca valores.
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = 'https://api.mercadopago.com/v1/account/release_report'
const SAIDA = 'docs/notas/mp-release-report.csv'
const COLUNAS = ['DATE', 'SOURCE_ID', 'EXTERNAL_REFERENCE', 'RECORD_TYPE', 'DESCRIPTION', 'NET_CREDIT_AMOUNT', 'NET_DEBIT_AMOUNT', 'GROSS_AMOUNT', 'MP_FEE_AMOUNT', 'PAYMENT_METHOD', 'BALANCE_AMOUNT']

const token = process.env.MP_TOKEN

async function api(caminho, metodo = 'GET', corpo) {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: corpo && JSON.stringify(corpo),
  })
  return { status: resp.status, texto: await resp.text() }
}

function parar(etapa, { status, texto }) {
  console.error(`${etapa}: HTTP ${status}\n${texto.slice(0, 500)}`)
  process.exit(1)
}

// Conta lançamentos por tipo; exportada para o teste. Não devolve nenhum valor em dinheiro.
export function resumir(csv) {
  const linhas = csv.trim().split(/\r?\n/)
  const sep = [';', ',', '\t'].find((s) => linhas[0].includes(s)) ?? ','
  const cabecalho = linhas[0].split(sep)
  const iTipo = cabecalho.indexOf('RECORD_TYPE')
  const iDesc = cabecalho.indexOf('DESCRIPTION')
  const iData = cabecalho.indexOf('DATE')
  const tipos = {}
  const datas = []
  for (const linha of linhas.slice(1)) {
    const c = linha.split(sep)
    const chave = `${c[iTipo] ?? '?'} / ${c[iDesc] ?? '?'}`
    tipos[chave] = (tipos[chave] ?? 0) + 1
    if (c[iData]) datas.push(c[iData].slice(0, 10))
  }
  datas.sort()
  return { separador: sep, cabecalho, linhas: linhas.length - 1, de: datas[0], ate: datas.at(-1), tipos }
}

async function principal() {
  if (!token) {
    console.error('MP_TOKEN vazio. Rode com: node --env-file=.env scripts/mp-relatorio.mjs')
    process.exit(1)
  }
  const config = await api('/config')
  if (config.status === 404) {
    const criada = await api('/config', 'POST', {
      file_name_prefix: 'organiza',
      display_timezone: 'GMT-03',
      execute_after_withdrawal: false,
      frequency: { hour: 0, type: 'monthly', value: 1 }, 
      columns: COLUNAS.map((key) => ({ key })),
    })
    if (criada.status !== 201 && criada.status !== 200) parar('Criar configuração', criada)
    console.log('configuração criada')
  } else if (config.status !== 200) parar('Ler configuração', config)

  const antes = await api('/list')
  if (antes.status !== 200) parar('Listar relatórios', antes)
  const jaExistiam = new Set(JSON.parse(antes.texto).map((r) => r.id))

  const fim = new Date()
  const inicio = new Date(fim - 30 * 86400000)
  const semMs = (d) => d.toISOString().slice(0, 19) + 'Z'
  const pedido = await api('', 'POST', { begin_date: semMs(inicio), end_date: semMs(fim) })
  if (pedido.status !== 202 && pedido.status !== 200) parar('Pedir relatório', pedido)
  console.log('relatório pedido, aguardando a geração (até 10 min)…')

  let novo
  for (let i = 0; i < 60 && !novo?.file_name; i++) {
    await new Promise((r) => setTimeout(r, 10000))
    const lista = await api('/list')
    if (lista.status !== 200) continue
    novo = JSON.parse(lista.texto).find((r) => !jaExistiam.has(r.id))
  }
  if (!novo?.file_name) {
    console.error('O relatório não ficou pronto em 10 min.', novo ? `Estado: ${novo.status}. Campos: ${Object.keys(novo).join(', ')}` : 'Não apareceu na lista.')
    process.exit(1)
  }

  const arquivo = await api('/' + encodeURIComponent(novo.file_name))
  if (arquivo.status !== 200) parar('Baixar relatório', arquivo)
  mkdirSync('docs/notas', { recursive: true })
  writeFileSync(SAIDA, arquivo.texto)
  console.log(`salvo em ${SAIDA}`)
  console.log(JSON.stringify(resumir(arquivo.texto), null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) await principal()
