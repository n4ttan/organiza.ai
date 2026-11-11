import { describe, expect, it } from 'vitest'
import { diasEntre, hojeEmBrasilia, lembretesDoDia, mensagemPush, turnoDoEnvio } from './lembretes.js'

const p = (extra) => ({ id: 'p', titulo: 'T', prioridade: 2, status: 'aberta', ...extra })
const dia = (pend, hoje = '2026-11-10') => lembretesDoDia({ pendencias: [pend] }, hoje)

describe('lembretesDoDia', () => {
  it('prazo em D-7, D-3, D-1, D-0', () => {
    for (const [prazo, dias] of [['2026-11-17', 7], ['2026-11-13', 3], ['2026-11-11', 1], ['2026-11-10', 0]]) {
      expect(dia(p({ prazo }))).toMatchObject([{ tipo: 'prazo', dias }])
    }
  })
  it('atrasada e feita', () => {
    expect(dia(p({ prazo: '2026-11-08' }))).toMatchObject([{ tipo: 'atrasada', dias: -2 }])
    expect(dia(p({ prazo: '2026-11-08', status: 'feita' }))).toEqual([])
  })
  it('evento: antes, durante, depois', () => {
    const e = { prazo: '2026-11-12', prazoFim: '2026-11-14' }
    expect(lembretesDoDia({ pendencias: [p(e)] }, '2026-11-10')[0]).toMatchObject({ tipo: 'prazo', dias: 2 })
    expect(lembretesDoDia({ pendencias: [p(e)] }, '2026-11-13')[0]).toMatchObject({ tipo: 'evento', dias: 0 })
    expect(lembretesDoDia({ pendencias: [p(e)] }, '2026-11-16')[0]).toMatchObject({ tipo: 'atrasada', dias: -2 })
  })
  it('fazer por data, sem sobrescrever prazo de hoje', () => {
    expect(dia(p({ data: '2026-11-09' }))).toMatchObject([{ tipo: 'fazer', dias: -1 }])
    expect(dia(p({ data: '2026-11-09', prazo: '2026-11-20' }))).toMatchObject([{ tipo: 'fazer' }])
    expect(dia(p({ data: '2026-11-09', prazo: '2026-11-10' }))).toMatchObject([{ tipo: 'prazo', dias: 0 }])
    expect(dia(p({ data: '2026-11-12' }))).toEqual([])
  })
  it('fatura com e sem valor, D-3 e D-0', () => {
    const contas = [{ id: 'c', nome: 'Nu', tipo: 'cartao', diaVencimento: 13, faturas: { '2026-11': 12345 } }]
    expect(lembretesDoDia({ contas }, '2026-11-10')).toEqual([
      { tipo: 'fatura', dias: 3, titulo: 'Fatura Nu vence dia 13 (R$ 123,45)', contaId: 'c' }
    ])
    expect(lembretesDoDia({ contas: [{ ...contas[0], faturas: {} }] }, '2026-11-13')[0])
      .toMatchObject({ dias: 0, titulo: 'Fatura Nu vence dia 13' })
    expect(lembretesDoDia({ contas }, '2026-11-09')).toEqual([])
  })
  it('fatura vira o mês: dia 31 em mês de 30', () => {
    const contas = [{ id: 'c', nome: 'Nu', tipo: 'cartao', diaVencimento: 31 }]
    expect(lembretesDoDia({ contas }, '2026-11-29')[0]).toMatchObject({ dias: 1, titulo: 'Fatura Nu vence dia 30' })
    expect(lembretesDoDia({ contas }, '2026-12-01')).toEqual([])
    expect(lembretesDoDia({ contas }, '2026-12-29')[0]).toMatchObject({ dias: 2 })
    expect(lembretesDoDia({ contas: [{ ...contas[0], diaVencimento: 2 }] }, '2026-12-30')[0]).toMatchObject({ dias: 3 })
  })
  it('ordena por dias e prioridade', () => {
    const pendencias = [p({ id: 'a', prazo: '2026-11-10', prioridade: 3 }), p({ id: 'b', prazo: '2026-11-10', prioridade: 1 }), p({ id: 'c', prazo: '2026-11-01' })]
    expect(lembretesDoDia({ pendencias }, '2026-11-10').map((l) => l.pendenciaId)).toEqual(['c', 'b', 'a'])
  })
})

describe('mensagemPush', () => {
  const ls = [
    { tipo: 'atrasada', dias: -2, titulo: 'A' },
    { tipo: 'prazo', dias: 0, titulo: 'B' },
    { tipo: 'prazo', dias: 1, titulo: 'C' },
    { tipo: 'prazo', dias: 5, titulo: 'D' }
  ]
  it('resumo filtra e formata', () => {
    expect(mensagemPush(ls, 'resumo')).toEqual({
      titulo: '1 atrasada · 1 para hoje',
      corpo: 'A · atrasada há 2 dias\nB · hoje\nC · amanhã'
    })
  })
  it('amanha só D-1; null sem nada', () => {
    expect(mensagemPush(ls, 'amanha')).toEqual({ titulo: 'Vence amanhã', corpo: 'C · amanhã' })
    expect(mensagemPush([ls[3]], 'resumo')).toBeNull()
    expect(mensagemPush([ls[0]], 'amanha')).toBeNull()
  })
  it('limita a 6 linhas', () => {
    const muitos = Array.from({ length: 8 }, (_, i) => ({ tipo: 'atrasada', dias: -1, titulo: `X${i}` }))
    const linhas = mensagemPush(muitos, 'resumo').corpo.split('\n')
    expect(linhas).toHaveLength(6)
    expect(linhas[5]).toBe('e mais 3')
  })
})

describe('turnoDoEnvio', () => {
  // 2026-11-10 é terça (2); Brasília = UTC-3
  const cfg = { horas: ['07:30', '19:00'], dias: [2, 3] }
  it('hora bate ou não', () => {
    expect(turnoDoEnvio(cfg, new Date('2026-11-10T10:05:00Z'))).toBe('resumo')
    expect(turnoDoEnvio(cfg, new Date('2026-11-10T22:05:00Z'))).toBe('amanha')
    expect(turnoDoEnvio(cfg, new Date('2026-11-10T12:05:00Z'))).toBeNull()
  })
  it('dia fora de dias', () => {
    expect(turnoDoEnvio({ ...cfg, dias: [3] }, new Date('2026-11-10T10:05:00Z'))).toBeNull()
  })
  it('usa Brasília: UTC já é quarta, lá ainda é terça', () => {
    const agora = new Date('2026-11-11T01:30:00Z')
    expect(hojeEmBrasilia(agora)).toBe('2026-11-10')
    expect(turnoDoEnvio({ horas: ['22:00'], dias: [2] }, agora)).toBe('resumo')
    expect(turnoDoEnvio({ horas: ['22:00'], dias: [3] }, agora)).toBeNull()
  })
  it('config ausente usa o padrão', () => {
    expect(turnoDoEnvio(undefined, new Date('2026-11-10T10:05:00Z'))).toBe('resumo')
  })
})

it('diasEntre', () => {
  expect(diasEntre('2026-11-10', '2026-12-10')).toBe(30)
  expect(diasEntre('2026-11-10', '2026-11-08')).toBe(-2)
})
