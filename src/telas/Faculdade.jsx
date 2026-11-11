import { CartaoProjeto } from './comum.jsx'

export default function Faculdade({ dados, aoAbrir }) {
  const lista = dados.projetos.filter((p) => p.area === 'faculdade' && p.status !== 'pronto').sort((a, b) => a.prioridade - b.prioridade)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl leading-tight font-semibold">Faculdade</h1>
      {lista.length === 0 && <p className="text-zinc-400">Nenhum projeto de faculdade em andamento.</p>}
      <ul className="flex flex-col gap-2">
        {lista.map((p) => (
          <CartaoProjeto key={p.id} projeto={p} pendencias={dados.pendencias} detalhado aoAbrir={aoAbrir} />
        ))}
      </ul>
    </div>
  )
}
