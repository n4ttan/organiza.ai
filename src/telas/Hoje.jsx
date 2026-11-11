import { diasEntre, hojeEmBrasilia, lembretesDoDia } from '../regras/lembretes.js'
import { PendenciaLinha, contagem } from './comum.jsx'

function diasDoToken(expiraEm) {
  if (!expiraEm) return null
  const venc = new Date(expiraEm.replace(' UTC', 'Z').replace(' ', 'T'))
  if (isNaN(venc)) return null
  return Math.ceil((venc - Date.now()) / 86400000)
}

export default function Hoje({ dados, expiraEm, aoAlternar, aoEditar }) {
  const itens = lembretesDoDia(dados, hojeEmBrasilia())
  const secoes = [
    ['Atrasadas', itens.filter((i) => i.tipo === 'atrasada')],
    ['Hoje', itens.filter((i) => i.tipo !== 'atrasada' && (i.tipo === 'evento' || i.tipo === 'fazer' || i.dias === 0))],
    ['Próximos prazos', itens.filter((i) => (i.tipo === 'prazo' || i.tipo === 'fatura') && i.dias > 0)],
  ].filter(([, lista]) => lista.length)
  const diasToken = diasDoToken(expiraEm)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl leading-tight font-semibold">Hoje</h1>
      {diasToken !== null && diasToken <= 14 && (
        <p className="rounded-lg border border-amber-400 bg-zinc-900 p-3 text-sm">
          O token do GitHub vence em {diasToken} {diasToken === 1 ? 'dia' : 'dias'}. Gere outro e cole em Ajustes.
        </p>
      )}
      {secoes.length === 0 && <p className="text-zinc-400">Nada para hoje. Toque em + para anotar uma pendência.</p>}
      {secoes.map(([nome, lista]) => (
        <section key={nome} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-zinc-400">{nome}</h2>
          <ul className="flex flex-col gap-2">
            {lista.map((i) => {
              const p = i.pendenciaId && dados.pendencias.find((x) => x.id === i.pendenciaId)
              const sub = i.tipo === 'evento' ? 'em andamento' : i.tipo === 'atrasada' || i.dias > 0 ? contagem(i.dias) : null
              if (!p) {
                return (
                  <li key={i.contaId} className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <span className="block">{i.titulo}</span>
                    {sub && <span className="text-sm text-zinc-400">{sub}</span>}
                  </li>
                )
              }
              return <PendenciaLinha key={p.id} p={p} sub={sub} aoAlternar={aoAlternar} aoEditar={aoEditar} />
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
