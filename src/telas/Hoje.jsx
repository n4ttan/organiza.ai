import { hojeEmBrasilia, lembretesDoDia } from '../regras/lembretes.js'
import { Cabecalho, Etiqueta, PendenciaLinha, Secao, Vazio, cartao, dataCurta, foco, lista, rotulo } from './comum.jsx'
import Icone from './icones.jsx'

function diasDoToken(expiraEm) {
  if (!expiraEm) return null
  const venc = new Date(expiraEm.replace(' UTC', 'Z').replace(' ', 'T'))
  if (isNaN(venc)) return null
  return Math.ceil((venc - Date.now()) / 86400000)
}

export default function Hoje({ dados, expiraEm, aoAlternar, aoEditar }) {
  const hoje = hojeEmBrasilia()
  const itens = lembretesDoDia(dados, hoje)
  const pendencia = (i) => i.pendenciaId && dados.pendencias.find((x) => x.id === i.pendenciaId)
  const nomeProjeto = (p) => dados.projetos.find((x) => x.id === p?.projetoId)?.nome

  const [destaque, ...depois] = itens.filter((i) => (i.tipo === 'prazo' || i.tipo === 'fatura') && i.dias > 0)
  const secoes = [
    ['Atrasadas', itens.filter((i) => i.tipo === 'atrasada')],
    ['Hoje', itens.filter((i) => i.tipo !== 'atrasada' && (i.tipo === 'evento' || i.tipo === 'fazer' || i.dias === 0))],
    ['Depois', depois],
  ].filter(([, l]) => l.length)
  const diasToken = diasDoToken(expiraEm)
  const pDestaque = destaque && pendencia(destaque)
  const Destaque = pDestaque ? 'button' : 'div'

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho sobre={new Date(hoje + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} titulo="Hoje" />

      {diasToken !== null && diasToken <= 14 && (
        <p className={`${cartao} p-4 text-sm`}>
          <strong className="font-semibold text-verde">Token do GitHub vence em {diasToken} {diasToken === 1 ? 'dia' : 'dias'}.</strong> Gere outro e cole em Ajustes.
        </p>
      )}

      {destaque && (
        <Destaque {...(pDestaque && { type: 'button', onClick: () => aoEditar(pDestaque) })} className={`${cartao} flex items-end justify-between gap-4 p-4 text-left ${pDestaque ? `transition-transform active:scale-[0.98] ${foco}` : ''}`}>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium tracking-wider text-verde uppercase">Próximo prazo</span>
            <span className="text-xl leading-tight font-semibold">{destaque.titulo}</span>
            {pDestaque && <span className="text-sm text-apagado">{[nomeProjeto(pDestaque), dataCurta(pDestaque.prazo)].filter(Boolean).join(' · ')}</span>}
          </span>
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-5xl leading-none font-semibold text-verde tabular-nums">{destaque.dias}</span>
            <span className="text-sm text-apagado">{destaque.dias === 1 ? 'dia' : 'dias'}</span>
          </span>
        </Destaque>
      )}

      {!destaque && secoes.length === 0 && <Vazio titulo="Tudo em dia">Toque em + para anotar uma pendência.</Vazio>}

      {secoes.map(([nome, itensDaSecao]) => (
        <Secao key={nome} titulo={nome} lateral={<span className={`${rotulo} tabular-nums`}>{itensDaSecao.length}</span>}>
          <ul className={lista}>
            {itensDaSecao.map((i) => {
              const p = pendencia(i)
              const evento = i.tipo === 'evento'
              const dias = i.tipo === 'atrasada' || i.dias > 0 ? i.dias : null
              if (!p) {
                return (
                  <li key={i.contaId} className="flex min-h-14 items-center gap-3 py-2 pr-3 pl-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-apagado"><Icone nome="cartao" /></span>
                    <span className="min-w-0 flex-1">{i.titulo}</span>
                    <Etiqueta dias={i.dias} />
                  </li>
                )
              }
              return <PendenciaLinha key={p.id} p={p} sub={nomeProjeto(p)} dias={dias} evento={evento} aoAlternar={aoAlternar} aoEditar={aoEditar} />
            })}
          </ul>
        </Secao>
      ))}
    </div>
  )
}
