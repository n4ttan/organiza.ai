import { describe, expect, it } from 'vitest'
import {
  desduplicar,
  hashTransacao,
  parseData,
  parseExtrato,
  parseLinhaValor,
  sugerirRecorrente,
} from './extrato.js'
import { resumoDoMes } from './financas.js'

describe('parseLinhaValor', () => {
  it('converte valores positivos e negativos em centavos', () => {
    expect(parseLinhaValor('+R$ 0,67')).toBe(67)
    expect(parseLinhaValor('+R$ 50,00')).toBe(5000)
    expect(parseLinhaValor('−R$ 25,00')).toBe(-2500) // com unicode minus −
    expect(parseLinhaValor('-R$ 12,90')).toBe(-1290) // com hífen comum -
    expect(parseLinhaValor('R$ 1.259,27')).toBe(125927)
    expect(parseLinhaValor('-2.364,45')).toBe(-236445)
    expect(parseLinhaValor('-112.48')).toBe(-11248)
    expect(parseLinhaValor('1004,27')).toBe(100427)
  })

  it('ignora valores sem moeda BRL (ex: Meli Dólar sem R$)', () => {
    expect(parseLinhaValor('+4,97 Meli Dólares')).toBeNull()
    expect(parseLinhaValor('+0.005 Bitcoin')).toBeNull()
    expect(parseLinhaValor('')).toBeNull()
    expect(parseLinhaValor('Recusado')).toBeNull()
  })
})

describe('parseData', () => {
  it('formata datas para YYYY-MM-DD', () => {
    expect(parseData('01/10', 2026)).toBe('2026-10-01')
    expect(parseData('05/11/2026')).toBe('2026-11-05')
    expect(parseData('2026-10-12T00:00:00')).toBe('2026-10-12')
    expect(parseData('invalido')).toBeNull()
  })
})

const AMOSTRA_MERCADO_PAGO = `
### MERCADO PAGO:
Movimentações — 01/10 a 11/11/2026

Pix recebidos
Data\tHorário\tOrigem\tValor
01/10\t06:16\tKaizen Gaming Brasil Ltda\t+R$ 0,67
02/10\t14:54\tMalibu Conveniencia E Eventos Ltda\t+R$ 50,00

Pix enviados
Data\tHorário\tDestino\tValor
03/10\t17:14\tPedro Henrique Ferreira\t−R$ 25,00
11/10\t17:09\tNattan Silva Montel\t−R$ 504,27

Operações no cartão
Data\tHorário\tDescrição\tValor
05/10\t14:45\tSpotify — cartão de crédito\t−R$ 12,90
30/10\t20:38\tPosto Majepac — cartão de crédito\t−R$ 40,00

Contas, fatura e empréstimos pagos
Data\tHorário\tDescrição\tValor
11/10\t17:10\tPagamento de fatura — cartão de crédito\t−R$ 365,89

Rendimentos registrados
Data\tHorário\tValor
05/10\t04:13\t+R$ 0,07
06/10\t01:59\t+R$ 0,13

Tentativas recusadas
Data\tHorário\tDescrição\tValor tentado\tSituação
05/11\t14:45\tSpotify — cartão de crédito\tR$ 12,90\tRecusado
`

const AMOSTRA_C6_CSV = `
Data;Descrição;Valor
01/10/2026;Pix recebido de Nattan Silva Montel;1004,27
02/10/2026;Pix recebido de Ana Carolina Teixeira Bernardo;255,00
05/10/2026;PGTO FAT CARTAO C6;-2364,45
11/10/2026;Pix enviado para Nattan Silva Montel;-112,48
15/10/2026;AUTO POSTO REKAR;-50,00
`

describe('parseExtrato - Mercado Pago', () => {
  const recorrentes = [
    { id: 'rec_spotify', descricao: 'Spotify', valorCentavos: -1290, categoria: 'assinaturas', ativo: true },
    { id: 'rec_gasolina', descricao: 'Posto', valorCentavos: -10000, categoria: 'transporte', ativo: true },
  ]
  const regras = [
    { contem: 'conveniencia', categoria: 'alimentacao' },
    { contem: 'gaming', categoria: 'lazer' },
  ]

  it('faz o parse do extrato do Mercado Pago e categoriza corretamente', () => {
    const txs = parseExtrato(AMOSTRA_MERCADO_PAGO, { anoPadrao: 2026, regras, recorrentes })

    // Total de válidos esperados (2 pix rec + 2 pix env + 2 cartao + 1 fatura + 2 rendimentos = 9)
    // Tentativas recusadas devem ser descartadas
    expect(txs.length).toBe(9)

    // Pix recebido
    const kaizen = txs.find((t) => t.descricao.includes('Kaizen'))
    expect(kaizen).toBeDefined()
    expect(kaizen.valorCentavos).toBe(67)
    expect(kaizen.tipo).toBe('credito')
    expect(kaizen.categoria).toBe('lazer') // bateu na regra "gaming"
    expect(kaizen.data).toBe('2026-10-01')

    // Pix enviado
    const pedro = txs.find((t) => t.descricao.includes('Pedro'))
    expect(pedro.valorCentavos).toBe(-2500)
    expect(pedro.tipo).toBe('debito')

    // Operação no cartão com recorrenteId sugerido
    const spotify = txs.find((t) => t.descricao.includes('Spotify'))
    expect(spotify.valorCentavos).toBe(-1290)
    expect(spotify.recorrenteId).toBe('rec_spotify')
    expect(spotify.categoria).toBe('assinaturas')

    // Posto Majepac associado a recorrente "Posto"
    const posto = txs.find((t) => t.descricao.includes('Posto Majepac'))
    expect(posto.valorCentavos).toBe(-4000)
    expect(posto.recorrenteId).toBe('rec_gasolina')
    expect(posto.categoria).toBe('transporte')

    // Pagamento de fatura deve receber categoria 'pagamento-fatura'
    const fatura = txs.find((t) => t.descricao.includes('Pagamento de fatura'))
    expect(fatura.valorCentavos).toBe(-36589)
    expect(fatura.categoria).toBe('pagamento-fatura')

    // Rendimentos registrados
    const rendimentos = txs.filter((t) => t.descricao.includes('Rendimento'))
    expect(rendimentos.length).toBe(2)
    expect(rendimentos[0].valorCentavos).toBe(7)
    expect(rendimentos[0].tipo).toBe('credito')
  })
})

describe('parseExtrato - C6 Bank CSV', () => {
  it('faz o parse do CSV do C6 Bank', () => {
    const regras = [{ contem: 'posto', categoria: 'transporte' }]
    const txs = parseExtrato(AMOSTRA_C6_CSV, { regras })

    expect(txs.length).toBe(5)

    const pixRec = txs.find((t) => t.descricao.includes('Pix recebido de Nattan'))
    expect(pixRec.valorCentavos).toBe(100427)
    expect(pixRec.tipo).toBe('credito')

    const fatura = txs.find((t) => t.descricao.includes('PGTO FAT CARTAO C6'))
    expect(fatura.valorCentavos).toBe(-236445)
    expect(fatura.categoria).toBe('pagamento-fatura')

    const posto = txs.find((t) => t.descricao.includes('AUTO POSTO REKAR'))
    expect(posto.valorCentavos).toBe(-5000)
    expect(posto.categoria).toBe('transporte')
  })
})

describe('parseExtrato - Mercado Pago Release Report CSV', () => {
  const AMOSTRA_RELEASE_REPORT = `DATE,SOURCE_ID,EXTERNAL_REFERENCE,RECORD_TYPE,DESCRIPTION,NET_CREDIT_AMOUNT,NET_DEBIT_AMOUNT,GROSS_AMOUNT,MP_FEE_AMOUNT,PAYMENT_METHOD,BALANCE_AMOUNT
2026-10-12T00:00:00.000-03:00,,,initial_available_balance,,456.60,0.00,456.60,0.00,,456.60
2026-10-12T10:15:00.000-03:00,101,,release,reserve_for_payout,0.00,20.00,20.00,0.00,,436.60
2026-10-12T10:15:01.000-03:00,101,REF1,release,payout,0.00,20.00,20.00,0.00,,436.60
2026-10-13T03:00:00.000-03:00,102,,release,asset_management,0.50,0.00,0.50,0.00,,437.10
,total,,,0.50,20.00,0.50,0.00,,437.10`

  it('ignora balanço inicial/total e reservas intermediárias', () => {
    const txs = parseExtrato(AMOSTRA_RELEASE_REPORT)
    // Espera apenas payout (101) e asset_management (102)
    expect(txs.length).toBe(2)

    const payout = txs.find((t) => t.identificadorOriginal === '101')
    expect(payout.valorCentavos).toBe(-2000)
    expect(payout.tipo).toBe('debito')
    expect(payout.descricao).toBe('Transferência enviada / Pix')

    const rendimento = txs.find((t) => t.identificadorOriginal === '102')
    expect(rendimento.valorCentavos).toBe(50)
    expect(rendimento.tipo).toBe('credito')
    expect(rendimento.descricao).toBe('Rendimento Mercado Pago')
  })
})

describe('sugerirRecorrente e Prevenção de Soma Duplicada', () => {
  const recorrentes = [
    { id: 'rec_gasolina', descricao: 'Posto de Gasolina', valorCentavos: -20000, categoria: 'transporte', ativo: true },
    { id: 'rec_spotify', descricao: 'Spotify', valorCentavos: -1290, categoria: 'assinaturas', ativo: true },
  ]

  it('sugere recorrenteId por match de texto', () => {
    const tx1 = { descricao: 'Spotify — cartão de crédito', valorCentavos: -1290 }
    expect(sugerirRecorrente(tx1, recorrentes)).toBe('rec_spotify')

    const tx2 = { descricao: 'Abastecimento Posto de Gasolina', valorCentavos: -5000 }
    expect(sugerirRecorrente(tx2, recorrentes)).toBe('rec_gasolina')

    const txOutra = { descricao: 'Padaria Estrela', valorCentavos: -1500 }
    expect(sugerirRecorrente(txOutra, recorrentes)).toBeNull()
  })

  it('evita soma duplicada em resumoDoMes quando recorrenteId está preenchido', () => {
    const dados = {
      contas: [{ id: 'cc', nome: 'Conta Corrente', tipo: 'corrente' }],
      recorrentes: [
        { id: 'rec_gasolina', descricao: 'Gasolina', valorCentavos: -20000, categoria: 'transporte', contaId: 'cc', ativo: true },
      ],
      transacoes: [
        // Lançamento com recorrenteId vinculado: NÃO deve somar nos gastos avulsos!
        { id: 't1', data: '2026-11-05', descricao: 'Posto Tigre', valorCentavos: -5000, categoria: 'transporte', contaId: 'cc', recorrenteId: 'rec_gasolina' },
        // Lançamento avulso sem vínculo: deve somar
        { id: 't2', data: '2026-11-06', descricao: 'Lanche', valorCentavos: -3000, categoria: 'alimentacao', contaId: 'cc' },
      ],
    }

    const resumo = resumoDoMes(dados, '2026-11')
    // Fixos: 20000 (o recorrente de gasolina)
    expect(resumo.fixos).toBe(20000)
    // Gastos avulsos: apenas os 3000 do lanche! Os 5000 do posto NÃO duplicam
    expect(resumo.gastos).toBe(3000)
  })
})

describe('desduplicar e hashTransacao', () => {
  it('gera hash estável para transações', () => {
    const t1 = { data: '2026-10-01', valorCentavos: 5000, descricao: 'Depósito' }
    const t2 = { data: '2026-10-01', valorCentavos: 5000, descricao: 'deposito' }
    expect(hashTransacao(t1)).toBe(hashTransacao(t2))
  })

  it('filtra transações duplicadas contra a base existente e dentro do mesmo lote', () => {
    const existentes = [
      { id: 'existente_1', data: '2026-10-01', valorCentavos: 67, descricao: 'Kaizen Gaming Brasil Ltda' },
      { id: 'existente_2', data: '2026-10-02', valorCentavos: 5000, descricao: 'Malibu Conveniencia E Eventos Ltda' },
    ]

    const novas = [
      // Duplicata da existente 1
      { data: '2026-10-01', valorCentavos: 67, descricao: 'Kaizen Gaming Brasil Ltda' },
      // Nova inédita
      { data: '2026-10-03', valorCentavos: -2500, descricao: 'Pedro Henrique Ferreira' },
      // Duplicada repetida 2x no lote
      { data: '2026-10-05', valorCentavos: -1290, descricao: 'Spotify' },
      { data: '2026-10-05', valorCentavos: -1290, descricao: 'Spotify' },
    ]

    const { unicas, duplicadas } = desduplicar(novas, existentes)

    expect(unicas.length).toBe(2)
    expect(unicas.map((t) => t.descricao)).toEqual(['Pedro Henrique Ferreira', 'Spotify'])
    expect(duplicadas.length).toBe(2)
  })
})
