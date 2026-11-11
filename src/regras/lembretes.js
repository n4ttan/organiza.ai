// Regras de lembrete: funções puras, usadas pelo app e pelo script Node de push.
const FUSO = 'America/Sao_Paulo'
const PADRAO = { horas: ['07:30', '19:00'], dias: [0, 1, 2, 3, 4, 5, 6] }

export function diasEntre(de, ate) {
  return Math.round((Date.parse(ate) - Date.parse(de)) / 86400000)
}

const pad = (n) => String(n).padStart(2, '0')

// Próximo vencimento >= hoje; o dia é limitado ao tamanho do mês.
function proximoVencimento(dia, hoje) {
  let [a, m] = hoje.split('-').map(Number)
  for (let i = 0; i < 2; i++) {
    const venc = `${a}-${pad(m)}-${pad(Math.min(dia, new Date(Date.UTC(a, m, 0)).getUTCDate()))}`
    if (venc >= hoje) return venc
    m === 12 ? (a++, (m = 1)) : m++
  }
}

function itemDaPendencia(p, hoje) {
  let item = null
  if (p.prazo && p.prazoFim) {
    if (hoje < p.prazo) item = { tipo: 'prazo', dias: diasEntre(hoje, p.prazo) }
    else if (hoje <= p.prazoFim) item = { tipo: 'evento', dias: 0 }
    else item = { tipo: 'atrasada', dias: diasEntre(hoje, p.prazoFim) }
  } else if (p.prazo) {
    const dias = diasEntre(hoje, p.prazo)
    item = { tipo: dias < 0 ? 'atrasada' : 'prazo', dias }
  }
  if ((!item || (item.tipo === 'prazo' && item.dias > 0)) && p.data && p.data <= hoje) {
    item = { tipo: 'fazer', dias: diasEntre(hoje, p.data) }
  }
  return item && { ...item, titulo: p.titulo, pendenciaId: p.id }
}

export function lembretesDoDia(dados, hoje) {
  const entradas = []
  for (const p of dados.pendencias ?? []) {
    if (p.status === 'feita') continue
    const item = itemDaPendencia(p, hoje)
    if (item) entradas.push([item, p.prioridade ?? 2])
  }
  for (const c of dados.contas ?? []) {
    if (c.tipo !== 'cartao' || !c.diaVencimento) continue
    const venc = proximoVencimento(c.diaVencimento, hoje)
    const dias = diasEntre(hoje, venc)
    if (dias > 3) continue
    const valor = c.faturas?.[venc.slice(0, 7)]
    const reais = valor == null ? '' : ` (R$ ${(valor / 100).toFixed(2).replace('.', ',')})`
    entradas.push([{ tipo: 'fatura', dias, titulo: `Fatura ${c.nome} vence dia ${Number(venc.slice(8))}${reais}`, contaId: c.id }, 2])
  }
  return entradas.sort((a, b) => a[0].dias - b[0].dias || a[1] - b[1]).map(([item]) => item)
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

function quando({ tipo, dias }) {
  if (tipo === 'atrasada') return `atrasada há ${plural(-dias, 'dia', 'dias')}`
  if (tipo === 'evento') return 'em andamento'
  if (tipo === 'fazer' || dias === 0) return 'hoje'
  return dias === 1 ? 'amanhã' : `em ${dias} dias`
}

export function mensagemPush(lembretes, turno) {
  const itens = lembretes.filter((l) =>
    turno === 'amanha'
      ? l.tipo === 'prazo' && l.dias === 1
      : l.tipo === 'prazo' ? [0, 1, 3, 7].includes(l.dias) : l.tipo === 'fatura' ? [0, 3].includes(l.dias) : true
  )
  if (!itens.length) return null
  let titulo = 'Vence amanhã'
  if (turno !== 'amanha') {
    const atrasadas = itens.filter((l) => l.tipo === 'atrasada').length
    const hoje = itens.filter((l) => l.tipo !== 'atrasada' && l.dias <= 0).length
    const partes = []
    if (atrasadas) partes.push(plural(atrasadas, 'atrasada', 'atrasadas'))
    if (hoje) partes.push(`${hoje} para hoje`)
    titulo = partes.join(' · ') || plural(itens.length, 'lembrete', 'lembretes')
  }
  const linhas = itens.map((l) => `${l.titulo} · ${quando(l)}`)
  if (linhas.length > 6) linhas.splice(5, linhas.length, `e mais ${linhas.length - 5}`)
  return { titulo, corpo: linhas.join('\n') }
}

function partesEmBrasilia(agora) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(agora).map(({ type, value }) => [type, value])
  )
  return { dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), hora: p.hour }
}

export function turnoDoEnvio(configLembretes, agora) {
  const { horas, dias } = { ...PADRAO, ...configLembretes }
  const { dia, hora } = partesEmBrasilia(agora)
  if (!dias.includes(dia)) return null
  // shortcut: o cron roda 1x por hora, então só a HH conta e os minutos configurados são ignorados.
  const i = [...horas].sort().findIndex((h) => h.slice(0, 2) === hora)
  return i < 0 ? null : i === 0 ? 'resumo' : 'amanha'
}

export function hojeEmBrasilia(agora = new Date()) {
  return agora.toLocaleDateString('en-CA', { timeZone: FUSO })
}
