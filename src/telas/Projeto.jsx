import { diasEntre, hojeEmBrasilia } from '../regras/lembretes.js'
import { PendenciaLinha, campo, contagem, foco } from './comum.jsx'
import Icone from './icones.jsx'

export default function Projeto({ projeto: p, pendencias, aoVoltar, aoAlternar, aoEditar, aoHoras }) {
  const hoje = hojeEmBrasilia()
  const lista = pendencias.filter((x) => x.projetoId === p.id).sort((a, b) => (a.status === 'feita') - (b.status === 'feita'))
  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={aoVoltar} className={`flex min-h-11 items-center gap-1 self-start rounded-lg pr-3 text-zinc-400 ${foco}`}>
        <Icone nome="voltar" />
        Voltar
      </button>
      <header className="flex flex-col gap-2">
        <h1 className="text-xl leading-tight font-semibold">{p.nome}</h1>
        {p.nota && <p className="text-zinc-400">{p.nota}</p>}
      </header>
      {p.horasTotal > 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horas feitas (de {p.horasTotal} h)</span>
          <input key={p.horasFeitas} type="number" inputMode="decimal" min="0" step="any" defaultValue={p.horasFeitas ?? 0} onBlur={(e) => aoHoras(p, e.target.value)} className={campo} />
        </label>
      )}
      {lista.length === 0 && <p className="text-zinc-400">Sem pendências. Toque em + para adicionar.</p>}
      <ul className="flex flex-col gap-2">
        {lista.map((x) => (
          <PendenciaLinha key={x.id} p={x} sub={x.prazo && x.status !== 'feita' ? contagem(diasEntre(hoje, x.prazo)) : null} aoAlternar={aoAlternar} aoEditar={aoEditar} />
        ))}
      </ul>
    </div>
  )
}
