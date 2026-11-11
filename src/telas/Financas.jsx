import { useState } from 'react'
import { centavosDe, formatarReais, resumoDoMes } from '../regras/financas.js'
import { hojeEmBrasilia } from '../regras/lembretes.js'
import { Cabecalho, Secao, campoCurto, cartao, dataCurta, foco, lista, rotulo } from './comum.jsx'
import Icone from './icones.jsx'

const outroMes = (mes, passo) => {
  const [a, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1 + passo, 1)).toISOString().slice(0, 7)
}
const nomeDoMes = (mes) => new Date(mes + '-15T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

// Barra empilhada em SVG: a CSP (style-src 'self') proíbe largura por style inline.
function Barra({ partes, total }) {
  let x = 0
  return (
    <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-2 w-full overflow-hidden rounded-full bg-relevo" aria-hidden="true">
      {total > 0 && partes.map(([nome, centavos, cor]) => {
        const largura = (Math.max(0, centavos) / total) * 100
        const rect = <rect key={nome} x={x} y="0" width={Math.max(0, largura - 0.6)} height="6" className={cor} />
        x += largura
        return rect
      })}
    </svg>
  )
}

function Linha({ titulo, sub, valor, apagada, aoTocar }) {
  return (
    <li>
      <button type="button" onClick={aoTocar} className={`flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors active:bg-relevo ${apagada ? 'opacity-60' : ''} ${foco}`}>
        <span className="flex min-w-0 flex-1 flex-col">
          <span>{titulo}</span>
          <span className="text-sm text-apagado">{sub}</span>
        </span>
        <span className={`shrink-0 font-medium tabular-nums ${valor > 0 ? 'text-verde' : ''}`}>{formatarReais(valor)}</span>
      </button>
    </li>
  )
}

export default function Financas({ dados, aoLancamento, aoRecorrente, aoFatura }) {
  const [mes, setMes] = useState(() => hojeEmBrasilia().slice(0, 7))
  const r = resumoDoMes(dados, mes)
  const contas = dados.contas ?? []
  const nomeConta = (id) => {
    const c = contas.find((x) => x.id === id)
    return c ? (c.tipo === 'cartao' ? `cartão ${c.nome}` : c.nome) : null
  }
  const lancamentos = (dados.transacoes ?? []).filter((t) => (t.faturaMes ?? t.data.slice(0, 7)) === mes).sort((a, b) => (a.data < b.data ? 1 : -1))
  const recorrentes = dados.recorrentes ?? []
  const partes = [
    ['Fixos', r.fixos, 'fill-neutral-500'],
    ['Gastos', r.gastos, 'fill-neutral-300'],
    ['Faturas', r.reservadoFatura, 'fill-verde-escuro'],
    ['Livre', r.livre, 'fill-verde'],
  ]
  const maior = r.porCategoria[0]?.centavos ?? 0
  const seta = `flex h-11 w-11 items-center justify-center rounded-full text-apagado transition-colors active:bg-relevo ${foco}`

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho sobre="Somente leitura e anotação" titulo="Finanças" />

      <div className={`${cartao} flex flex-col gap-4 p-4`}>
        <div className="-mx-2 -mt-2 flex items-center justify-between">
          <button type="button" onClick={() => setMes(outroMes(mes, -1))} aria-label="Mês anterior" className={seta}><Icone nome="voltar" tamanho={20} /></button>
          <p aria-live="polite" className={rotulo}>{nomeDoMes(mes)}</p>
          <button type="button" onClick={() => setMes(outroMes(mes, 1))} aria-label="Próximo mês" className={seta}><Icone nome="direita" tamanho={20} /></button>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-apagado">Livre no mês</p>
          <p className={`text-4xl leading-none font-semibold tracking-tight tabular-nums ${r.livre < 0 ? 'text-alerta' : 'text-verde'}`}>{formatarReais(r.livre)}</p>
          <p className="text-sm text-apagado tabular-nums">de {formatarReais(r.renda)} de renda</p>
        </div>
        <Barra partes={partes} total={Math.max(r.renda, r.fixos + r.gastos + r.reservadoFatura)} />
        <dl className="grid grid-cols-3 gap-2">
          {partes.slice(0, 3).map(([nome, centavos, cor]) => (
            <div key={nome} className="flex flex-col gap-1">
              <dt className="flex items-center gap-1 text-sm text-apagado">
                <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" className={cor} /></svg>
                {nome}
              </dt>
              <dd className="font-medium tabular-nums">{formatarReais(centavos)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {r.faturas.length > 0 && (
        <Secao titulo="Reservado para a fatura">
          <ul className={lista}>
            {r.faturas.map((f) => (
              <li key={f.contaId}>
                <label className="flex min-h-14 items-center gap-3 py-2 pr-3 pl-4">
                  <span className="text-apagado"><Icone nome="cartao" /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span>{f.nome}</span>
                    <span className="text-sm text-apagado">{[f.vencimento && `vence ${dataCurta(f.vencimento)}`, f.informado ? 'valor informado' : 'estimado'].filter(Boolean).join(' · ')}</span>
                  </span>
                  <input
                    key={`${mes}-${f.informado}-${f.centavos}`}
                    inputMode="decimal"
                    aria-label={`Valor da fatura ${f.nome}`}
                    defaultValue={f.informado ? (f.centavos / 100).toFixed(2).replace('.', ',') : ''}
                    placeholder={(f.centavos / 100).toFixed(2).replace('.', ',')}
                    onBlur={(e) => aoFatura(f.contaId, mes, e.target.value.trim() === '' ? null : centavosDe(e.target.value))}
                    className={`${campoCurto} w-28 shrink-0 bg-relevo text-right tabular-nums`}
                  />
                </label>
              </li>
            ))}
          </ul>
          <p className="px-1 text-sm text-apagado">Sem valor informado, a fatura é estimada pelas compras e recorrentes lançados no cartão.</p>
        </Secao>
      )}

      {r.porCategoria.length > 0 && (
        <Secao titulo="Por categoria">
          <ul className={`${cartao} flex flex-col gap-4 p-4`}>
            {r.porCategoria.map((c) => (
              <li key={c.categoria} className="flex flex-col gap-2">
                <span className="flex justify-between gap-3">
                  <span className="first-letter:uppercase">{c.categoria}</span>
                  <span className="text-apagado tabular-nums">{formatarReais(c.centavos)}</span>
                </span>
                <progress value={c.centavos} max={maior} aria-label={c.categoria} />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao titulo="Lançamentos">
        {lancamentos.length === 0 ? (
          <p className={`${cartao} p-4 text-sm text-apagado`}>Nenhum lançamento em {nomeDoMes(mes)}. Toque em + para anotar um gasto ou uma entrada.</p>
        ) : (
          <ul className={lista}>
            {lancamentos.map((t) => (
              <Linha key={t.id} titulo={t.descricao} sub={[dataCurta(t.data), t.categoria, nomeConta(t.contaId)].filter(Boolean).join(' · ')} valor={t.valorCentavos} aoTocar={() => aoLancamento(t)} />
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="Todo mês" lateral={<button type="button" onClick={() => aoRecorrente()} className={`-my-3 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-verde ${foco}`}><Icone nome="mais" tamanho={16} />Adicionar</button>}>
        {recorrentes.length > 0 && (
          <ul className={lista}>
            {recorrentes.map((x) => (
              <Linha key={x.id} titulo={x.descricao} sub={[x.categoria, nomeConta(x.contaId), x.ativo === false && 'desligado'].filter(Boolean).join(' · ')} valor={x.valorCentavos} apagada={x.ativo === false} aoTocar={() => aoRecorrente(x)} />
            ))}
          </ul>
        )}
      </Secao>
    </div>
  )
}
