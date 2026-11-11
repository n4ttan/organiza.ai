import { diasEntre, hojeEmBrasilia } from '../regras/lembretes.js'
import Icone from './icones.jsx'

export const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400'
export const campo = `h-12 w-full min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-3 ${foco}`

export function contagem(dias) {
  if (dias < 0) return `atrasada há ${-dias} ${dias === -1 ? 'dia' : 'dias'}`
  return dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`
}

export function PendenciaLinha({ p, sub, aoAlternar, aoEditar }) {
  const feita = p.status === 'feita'
  return (
    <li className={`flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1 ${feita ? 'opacity-70' : ''}`}>
      <button
        type="button"
        onClick={() => aoAlternar(p)}
        aria-label={`${feita ? 'Reabrir' : 'Concluir'}: ${p.titulo}`}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${feita ? 'bg-amber-400 text-zinc-950' : 'border border-zinc-800 text-zinc-400'} ${foco}`}
      >
        <Icone nome="check" />
      </button>
      <button type="button" onClick={() => aoEditar(p)} className={`flex min-h-11 flex-1 flex-col justify-center rounded-lg px-2 text-left ${foco}`}>
        <span className={feita ? 'line-through' : ''}>{p.titulo}</span>
        {sub && <span className="text-sm text-zinc-400">{sub}</span>}
      </button>
    </li>
  )
}

export function CartaoProjeto({ projeto: p, pendencias, detalhado, aoAbrir }) {
  const abertas = pendencias.filter((x) => x.projetoId === p.id && x.status !== 'feita')
  const proxima = abertas.filter((x) => x.prazo).sort((a, b) => (a.prazo < b.prazo ? -1 : 1))[0]
  const feitas = p.horasFeitas ?? 0
  return (
    <li>
      <button type="button" onClick={() => aoAbrir(p.id)} className={`flex min-h-11 w-full flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left ${foco}`}>
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{p.nome}</span>
          <span className="shrink-0 text-sm text-zinc-400">{abertas.length} {abertas.length === 1 ? 'aberta' : 'abertas'}</span>
        </span>
        {detalhado && (
          <span className="text-sm text-zinc-400">
            {proxima ? `${proxima.titulo} · ${contagem(diasEntre(hojeEmBrasilia(), proxima.prazo))}` : 'sem prazo'}
          </span>
        )}
        {detalhado && p.horasTotal > 0 && (
          <>
            <progress value={feitas} max={p.horasTotal} aria-label={`Horas feitas de ${p.nome}`} />
            <span className="text-sm text-zinc-400">faltam {Math.max(0, p.horasTotal - feitas)} h</span>
          </>
        )}
      </button>
    </li>
  )
}
