import { Cabecalho, LinhaProjeto, Vazio, lista } from './comum.jsx'

export default function Faculdade({ dados, aoAbrir }) {
  const projetos = dados.projetos.filter((p) => p.area === 'faculdade' && p.status !== 'pronto').sort((a, b) => a.prioridade - b.prioridade)
  return (
    <div className="flex flex-col gap-6">
      <Cabecalho sobre={`${projetos.length} em andamento`} titulo="Faculdade" />
      {projetos.length === 0 ? (
        <Vazio titulo="Nada em andamento">Nenhum projeto de faculdade ativo.</Vazio>
      ) : (
        <ul className={lista}>
          {projetos.map((p) => (
            <LinhaProjeto key={p.id} projeto={p} pendencias={dados.pendencias} detalhado aoAbrir={aoAbrir} />
          ))}
        </ul>
      )}
    </div>
  )
}
