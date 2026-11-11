import { diasEntre, hojeEmBrasilia } from '../regras/lembretes.js'
import Icone from './icones.jsx'

export const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde'
export const campoCurto = `h-12 min-w-0 rounded-xl border border-linha bg-painel px-3 text-tinta placeholder:text-apagado ${foco}`
export const campo = `w-full ${campoCurto}`
export const botao = `flex h-12 items-center justify-center gap-2 rounded-xl bg-verde px-4 font-semibold text-fundo transition-transform active:scale-[0.98] disabled:opacity-60 ${foco}`
export const botaoNeutro = `flex h-12 items-center justify-center gap-2 rounded-xl border border-linha px-4 transition-transform active:scale-[0.98] disabled:opacity-60 ${foco}`
export const cartao = 'rounded-2xl border border-linha bg-painel'
export const lista = `${cartao} divide-y divide-linha overflow-hidden`
export const rotulo = 'text-xs font-medium tracking-wider text-apagado uppercase'

export const dataCurta = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

export function Cabecalho({ sobre, titulo, children }) {
  return (
    <header className="flex flex-col gap-1 pr-12">
      {sobre && <p className="text-xs font-medium tracking-wider text-verde uppercase">{sobre}</p>}
      <h1 className="text-3xl leading-tight font-semibold tracking-tight">{titulo}</h1>
      {children}
    </header>
  )
}

export function Secao({ titulo, lateral, children }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between px-1">
        <h2 className={rotulo}>{titulo}</h2>
        {lateral}
      </div>
      {children}
    </section>
  )
}

export function Vazio({ titulo, children }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-verde/15 text-verde">
        <Icone nome="check" />
      </span>
      <p className="font-medium">{titulo}</p>
      <p className="text-sm text-apagado">{children}</p>
    </div>
  )
}

// Contagem de dias até o prazo; a cor acompanha a urgência, o texto diz o mesmo sem depender dela.
export function Etiqueta({ dias, evento }) {
  const [texto, cor] = evento
    ? ['agora', 'bg-verde text-fundo']
    : dias < 0
      ? [`${-dias} d atrás`, 'bg-alerta/15 text-alerta']
      : dias === 0
        ? ['hoje', 'bg-verde text-fundo']
        : dias === 1
          ? ['amanhã', 'bg-verde/15 text-verde']
          : [`${dias} dias`, dias <= 7 ? 'bg-verde/15 text-verde' : 'bg-relevo text-apagado']
  return <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium tabular-nums ${cor}`}>{texto}</span>
}

export function PendenciaLinha({ p, sub, dias, evento, aoAlternar, aoEditar }) {
  const feita = p.status === 'feita'
  const anel = feita ? 'border-verde bg-verde text-fundo' : p.prioridade === 1 ? 'border-verde' : 'border-neutral-600'
  return (
    <li className={`flex items-center pr-3 ${feita ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => aoAlternar(p)} aria-label={`${feita ? 'Reabrir' : 'Concluir'}: ${p.titulo}`} className={`flex h-14 w-12 shrink-0 items-center justify-center rounded-xl ${foco}`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${anel}`}>{feita && <Icone nome="check" tamanho={16} />}</span>
      </button>
      <button type="button" onClick={() => aoEditar(p)} className={`flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-xl py-2 pr-2 text-left ${foco}`}>
        <span className={feita ? 'line-through' : ''}>{p.titulo}</span>
        {sub && <span className="text-sm text-apagado">{sub}</span>}
      </button>
      {!feita && (evento || dias != null) && <Etiqueta dias={dias} evento={evento} />}
    </li>
  )
}

export function LinhaProjeto({ projeto: p, pendencias, detalhado, aoAbrir }) {
  const abertas = pendencias.filter((x) => x.projetoId === p.id && x.status !== 'feita')
  const proxima = abertas.filter((x) => x.prazo).sort((a, b) => (a.prazo < b.prazo ? -1 : 1))[0]
  const feitas = p.horasFeitas ?? 0
  return (
    <li>
      <button type="button" onClick={() => aoAbrir(p.id)} className={`flex min-h-14 w-full flex-col gap-2 px-4 py-3 text-left transition-colors active:bg-relevo ${foco}`}>
        <span className="flex items-center gap-2">
          {p.prioridade === 1 && <span className="h-2 w-2 shrink-0 rounded-full bg-verde" aria-label="Prioridade alta" role="img" />}
          <span className="min-w-0 flex-1 font-medium">{p.nome}</span>
          {abertas.length > 0 && <span className="shrink-0 text-sm text-apagado tabular-nums">{abertas.length} {abertas.length === 1 ? 'aberta' : 'abertas'}</span>}
          <span className="text-neutral-600"><Icone nome="direita" tamanho={16} /></span>
        </span>
        {detalhado && (
          <span className="flex items-center justify-between gap-3 text-sm text-apagado">
            <span className="min-w-0">{proxima ? proxima.titulo : 'Sem prazo marcado'}</span>
            {proxima && <Etiqueta dias={diasEntre(hojeEmBrasilia(), proxima.prazo)} />}
          </span>
        )}
        {detalhado && p.horasTotal > 0 && (
          <span className="flex flex-col gap-1">
            <progress value={feitas} max={p.horasTotal} aria-label={`Horas feitas de ${p.nome}`} />
            <span className="text-sm text-apagado tabular-nums">{feitas} de {p.horasTotal} h · faltam {Math.max(0, p.horasTotal - feitas)} h</span>
          </span>
        )}
      </button>
    </li>
  )
}
