import { Cabecalho, LinhaProjeto, Secao, Vazio, lista } from './comum.jsx'

const grupos = [['ativo', 'Ativos'], ['depois', 'Depois'], ['pronto', 'Prontos']]

export default function Projetos({ dados, aoAbrir }) {
  const outros = dados.projetos.filter((p) => p.area !== 'faculdade')
  const ativos = outros.filter((p) => p.status === 'ativo').length
  return (
    <div className="flex flex-col gap-6">
      <Cabecalho sobre={`${ativos} ${ativos === 1 ? 'ativo' : 'ativos'}`} titulo="Projetos" />
      {outros.length === 0 && <Vazio titulo="Nenhum projeto">Nada fora da faculdade por aqui.</Vazio>}
      {grupos.map(([status, nome]) => {
        const doGrupo = outros.filter((p) => p.status === status).sort((a, b) => a.prioridade - b.prioridade)
        return (
          doGrupo.length > 0 && (
            <Secao key={status} titulo={nome}>
              <ul className={lista}>
                {doGrupo.map((p) => (
                  <LinhaProjeto key={p.id} projeto={p} pendencias={dados.pendencias} aoAbrir={aoAbrir} />
                ))}
              </ul>
            </Secao>
          )
        )
      })}
    </div>
  )
}
