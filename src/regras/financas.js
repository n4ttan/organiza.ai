// Regras de finanças: funções puras, valores em centavos inteiros.
const pad = (n) => String(n).padStart(2, '0')
const soma = (lista, f) => lista.reduce((t, x) => t + f(x), 0)
const gasto = (lista) => soma(lista, (x) => -x.valorCentavos)
const normaliza = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function resumoDoMes(dados, mes) {
  const contas = dados.contas ?? []
  const cartoes = contas.filter((c) => c.tipo === 'cartao')
  const ehCartao = (id) => cartoes.some((c) => c.id === id)
  const recorrentes = (dados.recorrentes ?? []).filter((r) => r.ativo !== false)
  const transacoes = (dados.transacoes ?? []).filter((t) => t.categoria !== 'pagamento-fatura' && !t.recorrenteId)
  const doMes = transacoes.filter((t) => t.data.startsWith(mes) && !ehCartao(t.contaId))

  const renda = soma(recorrentes.filter((r) => r.valorCentavos > 0), (r) => r.valorCentavos) +
    soma(doMes.filter((t) => t.valorCentavos > 0), (t) => t.valorCentavos)
  const fixosLista = recorrentes.filter((r) => r.valorCentavos < 0 && !ehCartao(r.contaId))
  const fixos = gasto(fixosLista)
  const gastosLista = doMes.filter((t) => t.valorCentavos < 0)
  const gastos = gasto(gastosLista)

  const [a, m] = mes.split('-').map(Number)
  const diasNoMes = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const doCartao = (c) => [
    ...transacoes.filter((t) => t.contaId === c.id && t.faturaMes === mes),
    ...recorrentes.filter((r) => r.contaId === c.id && r.valorCentavos < 0),
  ]
  const faturas = cartoes.map((c) => {
    const informado = c.faturas?.[mes] != null
    return {
      contaId: c.id,
      nome: c.nome,
      vencimento: c.diaVencimento ? `${mes}-${pad(Math.min(c.diaVencimento, diasNoMes))}` : null,
      centavos: informado ? c.faturas[mes] : gasto(doCartao(c)),
      informado,
    }
  })
  const reservadoFatura = soma(faturas, (f) => f.centavos)

  const totais = {}
  for (const x of [...fixosLista, ...gastosLista, ...cartoes.flatMap(doCartao)]) {
    totais[x.categoria] = (totais[x.categoria] ?? 0) - x.valorCentavos
  }
  const porCategoria = Object.entries(totais)
    .map(([categoria, centavos]) => ({ categoria, centavos }))
    .filter((c) => c.centavos > 0)
    .sort((x, y) => y.centavos - x.centavos)

  return { renda, fixos, gastos, faturas, reservadoFatura, livre: renda - fixos - gastos - reservadoFatura, porCategoria }
}

export function categorizar(descricao, regras) {
  const d = normaliza(descricao)
  return (regras ?? []).find((r) => d.includes(normaliza(r.contem)))?.categoria ?? 'outros'
}

export function faturaPadrao(conta, hoje) {
  let [a, m, d] = hoje.split('-').map(Number)
  const diaCorte = conta.diaFechamento ?? conta.diaVencimento
  if (diaCorte && diaCorte < d) m === 12 ? (a++, (m = 1)) : m++
  return `${a}-${pad(m)}`
}

export function formatarReais(centavos) {
  const abs = Math.abs(centavos)
  const reais = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+$)/g, '.')
  return `${centavos < 0 ? '-' : ''}R$ ${reais},${pad(abs % 100)}`
}

export function centavosDe(texto) {
  const t = String(texto).replace(/R\$|\s/g, '')
  const n = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  return /^\d+(\.\d+)?$/.test(n) ? Math.round(Number(n) * 100) : null
}
