import { categorizar, centavosDe } from './financas.js'

export const normaliza = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

// Converte strings de valor com sinal (+R$ 0,67, −R$ 25,00, -2.364,45, etc.) em centavos inteiros.
// Retorna null se não for valor monetário em R$ ou número decimal reconhecível.
export function parseLinhaValor(str) {
  if (!str) return null
  const s = String(str).trim()
  // Ignora moedas não-BRL (ex: Meli Dólar, Bitcoin) sem valor em R$
  if (/meli\s*d[oó]lar|bitcoin/i.test(s) && !/r\$/i.test(s)) return null

  // Símbolos de menos: hífen comum (-) ou U+2212 (−)
  const ehNegativo = s.includes('−') || s.startsWith('-') || /^\(.*\)$/.test(s)
  const limpo = s.replace(/[-−+R$\s()]/g, '')
  if (!limpo) return null

  const n = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  if (!/^\d+(\.\d+)?$/.test(n)) return null

  const centavos = Math.round(Number(n) * 100)
  return ehNegativo ? -centavos : centavos
}

// Converte DD/MM ou DD/MM/AAAA ou AAAA-MM-DD para 'YYYY-MM-DD'
export function parseData(str, anoPadrao = 2026) {
  if (!str) return null
  const s = String(str).trim()
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (dmy) {
    const dia = dmy[1].padStart(2, '0')
    const mes = dmy[2].padStart(2, '0')
    let ano = dmy[3] ? Number(dmy[3]) : anoPadrao
    if (ano < 100) ano += 2000
    return `${ano}-${mes}-${dia}`
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`
  return null
}

// Gera identificador único da transação para desduplicação
export function hashTransacao(t) {
  if (t.identificadorOriginal) return `id:${t.identificadorOriginal}`
  const d = t.data || ''
  const v = t.valorCentavos ?? 0
  const desc = normaliza(t.descricao || '').trim().replace(/\s+/g, ' ')
  const h = t.hora ? `@${t.hora}` : ''
  return `${d}${h}:${v}:${desc}`
}

// Sugere o vínculo de um recorrenteId caso a transação corresponda a um recorrente ativo.
// Isso evita que o lançamento avulso some em dobro no cálculo de resumoDoMes.
export function sugerirRecorrente(transacao, recorrentes = []) {
  if (!recorrentes || recorrentes.length === 0) return null
  const descTx = normaliza(transacao.descricao || '')
  if (!descTx) return null

  const compativeis = recorrentes.filter((r) => {
    if (r.ativo === false) return false
    // Mesmo sinal (ambos despesa < 0 ou ambos receita > 0)
    return (transacao.valorCentavos < 0 && r.valorCentavos < 0) || (transacao.valorCentavos > 0 && r.valorCentavos > 0)
  })

  // 1. Prioridade: match de descrição E valor idêntico
  for (const r of compativeis) {
    const descRec = normaliza(r.descricao || '')
    if (descRec && (descTx.includes(descRec) || descRec.includes(descTx))) {
      if (Math.abs(r.valorCentavos) === Math.abs(transacao.valorCentavos)) {
        return r.id
      }
    }
  }

  // 2. Match de descrição (mesmo com valor variável, como gasolina ou conta de luz)
  for (const r of compativeis) {
    const descRec = normaliza(r.descricao || '')
    if (descRec.length >= 3 && (descTx.includes(descRec) || descRec.includes(descTx))) {
      return r.id
    }
  }

  return null
}

// Desduplica a lista de transações novas contra as transações já existentes no sistema
export function desduplicar(novas = [], existentes = []) {
  const chavesExistentes = new Set()

  for (const e of existentes) {
    chavesExistentes.add(hashTransacao(e))
    const chaveSemHora = `${e.data}:${e.valorCentavos}:${normaliza(e.descricao || '').trim().replace(/\s+/g, ' ')}`
    chavesExistentes.add(chaveSemHora)
  }

  const unicas = []
  const duplicadas = []
  const vistasNoLote = new Set()

  for (const t of novas) {
    const hCompleto = hashTransacao(t)
    const hSemHora = `${t.data}:${t.valorCentavos}:${normaliza(t.descricao || '').trim().replace(/\s+/g, ' ')}`

    if (chavesExistentes.has(hCompleto) || chavesExistentes.has(hSemHora) || vistasNoLote.has(hCompleto)) {
      duplicadas.push({ ...t, duplicada: true })
    } else {
      vistasNoLote.add(hCompleto)
      unicas.push(t)
    }
  }

  return { unicas, duplicadas }
}

// Detecta se a descrição é de pagamento de fatura
function ehPagamentoFatura(descricao) {
  const d = normaliza(descricao)
  return d.includes('pagamento de fatura') || d.includes('pgto fat') || d.includes('fatura c6') || d.includes('pgto fatura')
}

// Parser principal para unificar extratos do Mercado Pago e C6 Bank
export function parseExtrato(conteudo, opcoes = {}) {
  if (!conteudo || typeof conteudo !== 'string') return []

  const anoPadrao = opcoes.anoPadrao ?? 2026
  const regras = opcoes.regras ?? []
  const recorrentes = opcoes.recorrentes ?? []
  const contaId = opcoes.contaId ?? null

  const linhas = conteudo.trim().split(/\r?\n/)
  if (linhas.length === 0) return []

  // Caso 1: CSV Release Report da API do Mercado Pago
  if (linhas[0].includes('RECORD_TYPE') && linhas[0].includes('NET_CREDIT_AMOUNT')) {
    return parseMpReleaseReport(linhas, { anoPadrao, regras, recorrentes, contaId })
  }

  // Caso 2: Formato Markdown / Tabulado por Seções do Mercado Pago
  if (/pix recebidos|pix enviados|operacoes no cartao|rendimentos registrados/i.test(normaliza(conteudo))) {
    return parseMpMarkdown(linhas, { anoPadrao, regras, recorrentes, contaId })
  }

  // Caso 3: CSV genérico / C6 Bank (delimitado por ';' ou ',')
  const sep = [';', ',', '\t'].find((s) => linhas[0].includes(s)) ?? ';'
  return parseCsvGenerico(linhas, sep, { anoPadrao, regras, recorrentes, contaId })
}

function montarTransacao({ data, hora, descricao, valorCentavos, identificadorOriginal, regras, recorrentes, contaId, faturaMes }) {
  const tipo = valorCentavos >= 0 ? 'credito' : 'debito'
  let categoria = 'outros'

  if (ehPagamentoFatura(descricao)) {
    categoria = 'pagamento-fatura'
  } else if (/rendimento/i.test(descricao)) {
    categoria = categorizar(descricao, regras)
    if (categoria === 'outros') categoria = 'renda'
  } else {
    categoria = categorizar(descricao, regras)
  }

  const tx = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    data,
    ...(hora ? { hora } : {}),
    descricao: descricao.trim(),
    valorCentavos,
    tipo,
    categoria,
    contaId,
    ...(faturaMes ? { faturaMes } : {}),
    ...(identificadorOriginal ? { identificadorOriginal: String(identificadorOriginal) } : {}),
  }

  const recId = sugerirRecorrente(tx, recorrentes)
  if (recId) {
    tx.recorrenteId = recId
    const rec = recorrentes.find((r) => r.id === recId)
    if (rec && tx.categoria === 'outros') {
      tx.categoria = rec.categoria
    }
  }

  return tx
}

function parseMpMarkdown(linhas, { anoPadrao, regras, recorrentes, contaId }) {
  const secoesIgnoradas = [
    'tentativas recusadas',
    'eventos sem movimentacao financeira',
    'credito contratado no periodo',
  ]

  let secaoAtual = ''
  const transacoes = []

  for (const linha of linhas) {
    const raw = linha.trim()
    if (!raw) continue

    // Verifica se é título de seção
    const norm = normaliza(raw).replace(/^#+\s*/, '')
    if (
      !raw.includes('\t') &&
      !raw.includes(';') &&
      (!raw.includes('  ') || /^[a-z\s—-]+$/i.test(raw)) &&
      (norm.startsWith('pix') ||
        norm.startsWith('operacoes') ||
        norm.startsWith('outros pagamentos') ||
        norm.startsWith('contas, fatura') ||
        norm.startsWith('depositos e retiradas') ||
        norm.startsWith('cripto') ||
        norm.startsWith('rendimentos') ||
        norm.startsWith('tentativas') ||
        norm.startsWith('eventos') ||
        norm.startsWith('credito contratado'))
    ) {
      secaoAtual = norm
      continue
    }

    if (secoesIgnoradas.some((s) => secaoAtual.includes(s))) continue

    // Divide linha por tabulação, pipe ou múltiplos espaços
    const partes = raw.split(/\t+| \| |\s{2,}/).map((p) => p.trim())
    if (partes.length < 2) continue

    // Ignora linha de cabeçalho
    if (/^data$/i.test(partes[0])) continue

    const data = parseData(partes[0], anoPadrao)
    if (!data) continue

    let hora = null
    let descricao = ''
    let valorStr = ''

    if (secaoAtual.includes('rendimentos')) {
      // Rendimentos: [Data, Horário, Valor]
      hora = partes[1]?.includes(':') ? partes[1] : null
      descricao = 'Rendimento Mercado Pago'
      valorStr = partes.at(-1)
    } else {
      hora = partes[1]?.includes(':') ? partes[1] : null
      valorStr = partes.at(-1)
      const descPartes = partes.slice(hora ? 2 : 1, -1)
      descricao = descPartes.join(' ')
    }

    const valorCentavos = parseLinhaValor(valorStr)
    if (valorCentavos == null) continue

    // Operações no cartão
    let faturaMes = undefined
    if (secaoAtual.includes('cartao')) {
      const [ano, mes] = data.split('-')
      faturaMes = `${ano}-${mes}`
    }

    transacoes.push(
      montarTransacao({
        data,
        hora,
        descricao: descricao || 'Lançamento Mercado Pago',
        valorCentavos,
        regras,
        recorrentes,
        contaId,
        faturaMes,
      })
    )
  }

  return transacoes
}

function parseMpReleaseReport(linhas, { regras, recorrentes, contaId }) {
  const cabecalho = linhas[0].split(',')
  const iData = cabecalho.indexOf('DATE')
  const iSource = cabecalho.indexOf('SOURCE_ID')
  const iTipo = cabecalho.indexOf('RECORD_TYPE')
  const iDesc = cabecalho.indexOf('DESCRIPTION')
  const iCredito = cabecalho.indexOf('NET_CREDIT_AMOUNT')
  const iDebito = cabecalho.indexOf('NET_DEBIT_AMOUNT')

  const transacoes = []

  for (const linha of linhas.slice(1)) {
    const c = linha.split(',')
    if (c.length < cabecalho.length) continue

    const recordType = c[iTipo]
    if (recordType === 'initial_available_balance' || recordType === 'total') continue

    const descTipo = c[iDesc]
    // Ignora registros intermediários de retenção de reserva para não duplicar com o payout/payment efetivo
    if (descTipo === 'reserve_for_payout' || descTipo === 'reserve_for_payment') continue

    const creditoCentavos = centavosDe(c[iCredito]) ?? 0
    const debitoCentavos = centavosDe(c[iDebito]) ?? 0
    const valorCentavos = creditoCentavos > 0 ? creditoCentavos : -debitoCentavos
    if (valorCentavos === 0) continue

    const data = c[iData]?.slice(0, 10)
    const hora = c[iData]?.slice(11, 16) || null

    let descLegivel = descTipo
    if (descTipo === 'asset_management') descLegivel = 'Rendimento Mercado Pago'
    else if (descTipo === 'payout') descLegivel = 'Transferência enviada / Pix'
    else if (descTipo === 'payment') descLegivel = 'Pagamento / Pix'
    else if (descTipo === 'credit_payment') descLegivel = 'Pagamento no crédito'

    transacoes.push(
      montarTransacao({
        data,
        hora,
        descricao: descLegivel,
        valorCentavos,
        identificadorOriginal: c[iSource],
        regras,
        recorrentes,
        contaId,
      })
    )
  }

  return transacoes
}

function parseCsvGenerico(linhas, separador, { anoPadrao, regras, recorrentes, contaId }) {
  const transacoes = []
  if (linhas.length === 0) return transacoes

  // Detecta índices do cabeçalho
  const cabecalho = linhas[0].split(separador).map((c) => normaliza(c.trim()))
  let iData = cabecalho.findIndex((c) => c.includes('data'))
  let iDesc = cabecalho.findIndex((c) => c.includes('desc') || c.includes('hist') || c.includes('estab') || c.includes('origem') || c.includes('destino'))
  let iValor = cabecalho.findIndex((c) => c.includes('valor') || c.includes('montante') || c.includes('quantia'))

  // Se não achou por nome, assume ordem padrão [0: data, 1: desc, 2: valor]
  if (iData === -1) iData = 0
  if (iDesc === -1) iDesc = 1
  if (iValor === -1) iValor = cabecalho.length > 2 ? 2 : 1

  const inicio = cabecalho.some((c) => c.includes('data') || c.includes('valor') || c.includes('desc')) ? 1 : 0

  for (const linha of linhas.slice(inicio)) {
    const raw = linha.trim()
    if (!raw) continue

    const colunas = raw.split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    if (colunas.length < 2) continue

    const data = parseData(colunas[iData], anoPadrao)
    if (!data) continue

    const descricao = colunas[iDesc] || 'Lançamento C6 Bank'
    const valorCentavos = parseLinhaValor(colunas[iValor])
    if (valorCentavos == null) continue

    transacoes.push(
      montarTransacao({
        data,
        descricao,
        valorCentavos,
        regras,
        recorrentes,
        contaId,
      })
    )
  }

  return transacoes
}
