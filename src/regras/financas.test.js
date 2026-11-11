import { describe, expect, it } from 'vitest'
import { categorizar, centavosDe, faturaPadrao, formatarReais, resumoDoMes } from './financas.js'

const cartao = { id: 'cartao-mp', nome: 'MP', tipo: 'cartao', diaVencimento: 10 }
const base = {
  contas: [{ id: 'cc', nome: 'CC', tipo: 'corrente' }, cartao],
  recorrentes: [
    { id: 'r1', valorCentavos: 45000, categoria: 'renda', contaId: null, ativo: true },
    { id: 'r2', valorCentavos: 30000, categoria: 'renda', contaId: null, ativo: true },
    { id: 'r3', valorCentavos: 25000, categoria: 'renda', contaId: null, ativo: true },
    { id: 'r4', valorCentavos: -5000, categoria: 'casa', contaId: 'cartao-mp', ativo: true },
    { id: 'r5', valorCentavos: -1500, categoria: 'lazer', contaId: 'cartao-mp', ativo: true },
    { id: 'r6', valorCentavos: -12000, categoria: 'trabalho', contaId: 'cartao-mp', ativo: true },
    { id: 'r7', valorCentavos: -20000, categoria: 'transporte', contaId: null, ativo: true },
  ],
}
const t = (extra) => ({ id: 't', data: '2026-11-05', valorCentavos: -1000, descricao: 'x', categoria: 'mercado', contaId: 'cc', ...extra })
const com = (transacoes, extra) => resumoDoMes({ ...base, transacoes, ...extra }, '2026-11')

describe('resumoDoMes', () => {
  it('recorrentes reais', () => {
    const r = resumoDoMes(base, '2026-11')
    expect(r).toMatchObject({ renda: 100000, fixos: 20000, gastos: 0, reservadoFatura: 18500, livre: 61500 })
    expect(r.faturas[0]).toEqual({ contaId: 'cartao-mp', nome: 'MP', vencimento: '2026-11-10', centavos: 18500, informado: false })
  })
  it('compra no cartão cai pelo faturaMes, não pela data', () => {
    const r = com([t({ contaId: 'cartao-mp', data: '2026-10-28', valorCentavos: -3000, faturaMes: '2026-11' })])
    expect(r.reservadoFatura).toBe(21500)
    expect(r.gastos).toBe(0)
    expect(com([t({ contaId: 'cartao-mp', data: '2026-11-02', faturaMes: '2026-12' })]).reservadoFatura).toBe(18500)
  })
  it('estorno no cartão abate', () => {
    expect(com([t({ contaId: 'cartao-mp', valorCentavos: 500, faturaMes: '2026-11' })]).reservadoFatura).toBe(18000)
  })
  it('pagamento-fatura não conta em dobro', () => {
    expect(com([t({ categoria: 'pagamento-fatura', valorCentavos: -18500 })]).gastos).toBe(0)
  })
  it('fatura informada substitui a soma', () => {
    const r = com([], { contas: [base.contas[0], { ...cartao, faturas: { '2026-11': 0 } }] })
    expect(r.faturas[0]).toMatchObject({ centavos: 0, informado: true })
    expect(r.reservadoFatura).toBe(0)
  })
  it('recorrenteId e recorrente inativo ignorados', () => {
    expect(com([t({ recorrenteId: 'r7' })]).gastos).toBe(0)
    const r = resumoDoMes({ ...base, recorrentes: base.recorrentes.map((x) => ({ ...x, ativo: false })) }, '2026-11')
    expect(r).toMatchObject({ renda: 0, fixos: 0, reservadoFatura: 0 })
  })
  it('vencimento limitado ao mês e sem dia', () => {
    const r = resumoDoMes({ contas: [{ id: 'c', nome: 'C', tipo: 'cartao', diaVencimento: 31 }, { id: 'd', nome: 'D', tipo: 'cartao' }] }, '2026-02')
    expect(r.faturas.map((f) => f.vencimento)).toEqual(['2026-02-28', null])
  })
  it('porCategoria ordenado e sem totais <= 0', () => {
    const r = com([t({ valorCentavos: -30000 }), t({ categoria: 'saude', valorCentavos: -100 }), t({ categoria: 'zero', valorCentavos: -100 }), t({ categoria: 'zero', contaId: 'cartao-mp', valorCentavos: 100, faturaMes: '2026-11' })])
    expect(r.porCategoria.map((c) => c.categoria)).toEqual(['mercado', 'transporte', 'trabalho', 'casa', 'lazer', 'saude'])
    expect(r.porCategoria[0]).toEqual({ categoria: 'mercado', centavos: 30000 })
  })
})

describe('categorizar', () => {
  it('ignora acento e maiúscula', () => {
    const regras = [{ contem: 'padaria', categoria: 'mercado' }, { contem: 'café', categoria: 'lazer' }]
    expect(categorizar('PADARIA Pão', regras)).toBe('mercado')
    expect(categorizar('Cafe do Zé', regras)).toBe('lazer')
    expect(categorizar('xyz', regras)).toBe('outros')
    expect(categorizar('xyz')).toBe('outros')
  })
})

describe('faturaPadrao', () => {
  it('antes, no dia e depois do vencimento, e virada de ano', () => {
    expect(faturaPadrao(cartao, '2026-11-05')).toBe('2026-11')
    expect(faturaPadrao(cartao, '2026-11-10')).toBe('2026-11')
    expect(faturaPadrao(cartao, '2026-11-11')).toBe('2026-12')
    expect(faturaPadrao(cartao, '2026-12-20')).toBe('2027-01')
    expect(faturaPadrao({ id: 'x' }, '2026-12-20')).toBe('2026-12')
  })
})

describe('formatarReais', () => {
  it('formata', () => {
    expect(formatarReais(123456)).toBe('R$ 1.234,56')
    expect(formatarReais(-500)).toBe('-R$ 5,00')
    expect(formatarReais(0)).toBe('R$ 0,00')
    expect(formatarReais(5)).toBe('R$ 0,05')
  })
})

describe('centavosDe', () => {
  it('converte', () => {
    expect(centavosDe('12,50')).toBe(1250)
    expect(centavosDe('1.234,56')).toBe(123456)
    expect(centavosDe('12.5')).toBe(1250)
    expect(centavosDe('12')).toBe(1200)
    expect(centavosDe('R$ 7,9')).toBe(790)
  })
  it('inválido vira null', () => {
    for (const v of ['', '  ', '-5', 'abc', '1,2,3']) expect(centavosDe(v)).toBeNull()
  })
})
