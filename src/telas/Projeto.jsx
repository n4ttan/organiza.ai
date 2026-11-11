import { diasEntre, hojeEmBrasilia } from '../regras/lembretes.js'
import { Cabecalho, PendenciaLinha, Secao, Vazio, campoCurto, cartao, foco, lista } from './comum.jsx'
import Icone from './icones.jsx'

const nomesStatus = { fazendo: 'Fazendo', aguardando: 'Aguardando' }

export default function Projeto({ projeto: p, pendencias, aoVoltar, aoAlternar, aoEditar, aoHoras }) {
  const hoje = hojeEmBrasilia()
  const doProjeto = pendencias.filter((x) => x.projetoId === p.id)
  const grupos = [
    ['Abertas', doProjeto.filter((x) => x.status !== 'feita')],
    ['Concluídas', doProjeto.filter((x) => x.status === 'feita')],
  ].filter(([, l]) => l.length)
  const feitas = p.horasFeitas ?? 0
  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={aoVoltar} className={`-ml-2 flex min-h-11 items-center gap-1 self-start rounded-xl pr-3 text-apagado ${foco}`}>
        <Icone nome="voltar" />
        Voltar
      </button>
      <Cabecalho titulo={p.nome}>{p.nota && <p className="text-apagado">{p.nota}</p>}</Cabecalho>
      {p.horasTotal > 0 && (
        <div className={`${cartao} flex flex-col gap-3 p-4`}>
          <progress value={feitas} max={p.horasTotal} aria-label="Horas feitas" />
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-apagado">Horas feitas (de {p.horasTotal} h)</span>
            <input key={p.horasFeitas} type="number" inputMode="decimal" min="0" step="any" defaultValue={feitas} onBlur={(e) => aoHoras(p, e.target.value)} className={`${campoCurto} w-24 shrink-0 bg-relevo text-right tabular-nums`} />
          </label>
        </div>
      )}
      {grupos.length === 0 && <Vazio titulo="Sem pendências">Toque em + para adicionar.</Vazio>}
      {grupos.map(([nome, itens]) => (
        <Secao key={nome} titulo={nome}>
          <ul className={lista}>
            {itens.map((x) => (
              <PendenciaLinha key={x.id} p={x} sub={nomesStatus[x.status]} dias={x.prazo ? diasEntre(hoje, x.prazo) : null} aoAlternar={aoAlternar} aoEditar={aoEditar} />
            ))}
          </ul>
        </Secao>
      ))}
    </div>
  )
}
