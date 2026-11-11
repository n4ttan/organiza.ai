import { useState } from 'react'
import { hojeEmBrasilia } from '../regras/lembretes.js'
import { campo, foco } from './comum.jsx'
import Icone from './icones.jsx'

const prioridades = [[1, 'Alta'], [2, 'Média'], [3, 'Baixa']]
const statusLista = [['aberta', 'Aberta'], ['fazendo', 'Fazendo'], ['aguardando', 'Aguardando'], ['feita', 'Feita']]

export default function Formulario({ projetos, inicial, projetoId: projetoInicial, aoSalvar, aoExcluir, aoFechar }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [projetoId, setProjetoId] = useState(inicial?.projetoId ?? projetoInicial ?? '')
  const [prazo, setPrazo] = useState(inicial?.prazo ?? '')
  const [prazoFim, setPrazoFim] = useState(inicial?.prazoFim ?? '')
  const [data, setData] = useState(inicial?.data ?? '')
  const [prioridade, setPrioridade] = useState(inicial?.prioridade ?? 2)
  const [status, setStatus] = useState(inicial?.status ?? 'aberta')

  function enviar(e) {
    e.preventDefault()
    const hoje = hojeEmBrasilia()
    const area = projetos.find((p) => p.id === projetoId)?.area ?? inicial?.area ?? 'pessoal'
    const p = inicial
      ? { ...inicial }
      : { id: crypto.randomUUID(), dono: 'eu', origem: 'manual', criadaEm: hoje }
    Object.assign(p, { titulo: titulo.trim(), area, prioridade, status })
    for (const [chave, valor] of [['projetoId', projetoId], ['prazo', prazo], ['prazoFim', prazo && prazoFim], ['data', data]]) {
      if (valor) p[chave] = valor
      else delete p[chave]
    }
    if (status === 'feita') p.feitaEm ??= hoje
    else delete p.feitaEm
    aoSalvar(p)
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-16 text-zinc-50">
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl leading-tight font-semibold">{inicial ? 'Editar pendência' : 'Nova pendência'}</h1>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className={`flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 ${foco}`}>
            <Icone nome="fechar" />
          </button>
        </header>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Título</span>
          <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} className={campo} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Projeto</span>
          <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} className={campo}>
            <option value="">Sem projeto</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Prazo</span>
            <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={campo} />
          </label>
          {prazo && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Até</span>
              <input type="date" min={prazo} value={prazoFim} onChange={(e) => setPrazoFim(e.target.value)} className={campo} />
            </label>
          )}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Data planejada</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={campo} />
        </label>

        <div className="flex flex-col gap-2">
          <span id="rotulo-prioridade" className="text-sm font-medium">Prioridade</span>
          <div role="group" aria-labelledby="rotulo-prioridade" className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {prioridades.map(([n, nome]) => (
              <button key={n} type="button" aria-pressed={prioridade === n} onClick={() => setPrioridade(n)} className={`h-11 rounded-lg ${prioridade === n ? 'bg-amber-400 font-semibold text-zinc-950' : 'text-zinc-400'} ${foco}`}>
                {nome}
              </button>
            ))}
          </div>
        </div>

        {inicial && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={campo}>
              {statusLista.map(([valor, nome]) => (
                <option key={valor} value={valor}>{nome}</option>
              ))}
            </select>
          </label>
        )}

        <button type="submit" className={`h-12 rounded-lg bg-amber-400 font-semibold text-zinc-950 ${foco}`}>
          Salvar
        </button>
        {inicial && (
          <button
            type="button"
            onClick={() => confirm('Excluir esta pendência?') && aoExcluir(inicial)}
            className={`flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-800 text-red-400 ${foco}`}
          >
            <Icone nome="lixo" />
            Excluir
          </button>
        )}
      </form>
    </main>
  )
}
