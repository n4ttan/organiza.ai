import { CartaoProjeto } from './comum.jsx'

const grupos = [['ativo', 'Ativos'], ['depois', 'Depois'], ['pronto', 'Prontos']]

export default function Projetos({ dados, aoAbrir }) {
  const outros = dados.projetos.filter((p) => p.area !== 'faculdade')
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl leading-tight font-semibold">Projetos</h1>
      {outros.length === 0 && <p className="text-zinc-400">Nenhum projeto fora da faculdade.</p>}
      {grupos.map(([status, nome]) => {
        const lista = outros.filter((p) => p.status === status).sort((a, b) => a.prioridade - b.prioridade)
        return (
          lista.length > 0 && (
            <section key={status} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-zinc-400">{nome}</h2>
              <ul className="flex flex-col gap-2">
                {lista.map((p) => (
                  <CartaoProjeto key={p.id} projeto={p} pendencias={dados.pendencias} aoAbrir={aoAbrir} />
                ))}
              </ul>
            </section>
          )
        )
      })}
    </div>
  )
}
