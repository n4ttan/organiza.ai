import { useState } from 'react'
import { categorizar, centavosDe, faturaPadrao, formatarReais } from '../regras/financas.js'
import { hojeEmBrasilia } from '../regras/lembretes.js'
import { botao, botaoNeutro, campo, foco } from './comum.jsx'
import Icone from './icones.jsx'

const rotuloCampo = 'text-sm font-medium text-apagado'
const nomeConta = (c) => (c.tipo === 'cartao' ? `Cartão ${c.nome}` : c.nome)

// Um formulário para os dois casos: lançamento (tem data e fatura) e recorrente (tem liga/desliga).
export default function FormularioFinancas({ modo, inicial, dados, aoSalvar, aoExcluir, aoFechar }) {
  const recorrente = modo === 'recorrente'
  const hoje = hojeEmBrasilia()
  const contas = dados.contas ?? []
  const recorrentes = dados.recorrentes ?? []
  const categorias = dados.config?.categorias ?? ['outros']
  const regras = dados.config?.regrasCategoria

  const [entrada, setEntrada] = useState((inicial?.valorCentavos ?? -1) > 0)
  const [valor, setValor] = useState(inicial ? (Math.abs(inicial.valorCentavos) / 100).toFixed(2).replace('.', ',') : '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [categoria, setCategoria] = useState(inicial?.categoria ?? '')
  const [contaId, setContaId] = useState(inicial ? (inicial.contaId ?? '') : recorrente ? '' : (contas[0]?.id ?? ''))
  const [data, setData] = useState(inicial?.data ?? hoje)
  const [faturaMes, setFaturaMes] = useState(inicial?.faturaMes ?? '')
  const [recorrenteId, setRecorrenteId] = useState(inicial?.recorrenteId ?? '')
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true)
  const [lembrar, setLembrar] = useState(false)

  const conta = contas.find((c) => c.id === contaId)
  const noCartao = conta?.tipo === 'cartao'
  const centavos = centavosDe(valor)
  const categoriaFinal = entrada ? 'renda' : categoria || categorizar(descricao, regras)
  const fatura = faturaMes || (noCartao ? faturaPadrao(conta, hoje) : '')

  function enviar(e) {
    e.preventDefault()
    if (!centavos) return
    const item = { ...inicial, id: inicial?.id ?? crypto.randomUUID(), descricao: descricao.trim(), valorCentavos: entrada ? centavos : -centavos, categoria: categoriaFinal, contaId: contaId || null }
    if (recorrente) item.ativo = ativo
    else {
      Object.assign(item, { data, origem: inicial?.origem ?? 'manual' })
      if (noCartao) item.faturaMes = fatura
      else delete item.faturaMes
      if (recorrenteId) item.recorrenteId = recorrenteId
      else delete item.recorrenteId
    }
    aoSalvar(item, lembrar && !entrada ? { contem: descricao.trim(), categoria: categoriaFinal } : null)
  }

  const oQue = recorrente ? 'recorrente' : 'lançamento'
  return (
    <main className="topo-seguro mx-auto max-w-md px-4 pb-16 text-tinta">
      <form onSubmit={enviar} className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">{inicial ? `Editar ${oQue}` : `Novo ${oQue}`}</h1>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className={`flex h-11 w-11 items-center justify-center rounded-xl text-apagado ${foco}`}>
            <Icone nome="fechar" />
          </button>
        </header>

        <div role="group" aria-label="Tipo" className="grid grid-cols-2 gap-1 rounded-xl border border-linha bg-painel p-1">
          {[[false, 'Gasto'], [true, 'Entrada']].map(([v, nome]) => (
            <button key={nome} type="button" aria-pressed={entrada === v} onClick={() => setEntrada(v)} className={`h-11 rounded-lg ${entrada === v ? 'bg-verde font-semibold text-fundo' : 'text-apagado'} ${foco}`}>
              {nome}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-2">
          <span className={rotuloCampo}>Valor (R$)</span>
          <input required inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} aria-invalid={valor !== '' && !centavos} aria-describedby="erro-valor" className={`${campo} h-14 text-2xl font-semibold tabular-nums`} />
          <span id="erro-valor" role="alert" className="text-sm text-alerta">{valor !== '' && !centavos ? 'Digite um valor maior que zero, como 12,50.' : ''}</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={rotuloCampo}>Descrição</span>
          <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={campo} />
        </label>

        {!entrada && (
          <label className="flex flex-col gap-2">
            <span className={rotuloCampo}>Categoria</span>
            <select value={categoriaFinal} onChange={(e) => setCategoria(e.target.value)} className={campo}>
              {[...new Set([...categorias, 'outros', categoriaFinal])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {!recorrente && categoriaFinal !== 'pagamento-fatura' && <option value="pagamento-fatura">pagamento-fatura (não conta como gasto)</option>}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className={rotuloCampo}>Conta</span>
          <select value={contaId} onChange={(e) => (setContaId(e.target.value), setFaturaMes(''))} className={campo}>
            {recorrente && <option value="">Sem conta definida</option>}
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{nomeConta(c)}</option>
            ))}
          </select>
        </label>

        {!recorrente && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className={rotuloCampo}>Data</span>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)} className={campo} />
            </label>
            {noCartao && (
              <label className="flex flex-col gap-2">
                <span className={rotuloCampo}>Fatura</span>
                <input type="month" required value={fatura} onChange={(e) => setFaturaMes(e.target.value)} className={campo} />
              </label>
            )}
          </div>
        )}

        {!recorrente && !entrada && recorrentes.length > 0 && (
          <label className="flex flex-col gap-2">
            <span className={rotuloCampo}>Vincular ao recorrente (opcional)</span>
            <select value={recorrenteId} onChange={(e) => setRecorrenteId(e.target.value)} className={campo}>
              <option value="">Nenhum (gasto avulso)</option>
              {recorrentes.filter((r) => r.ativo !== false && r.valorCentavos < 0).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.descricao} ({formatarReais(r.valorCentavos)})
                </option>
              ))}
            </select>
            <span className="text-xs text-apagado">
              Lançamentos vinculados a um recorrente não duplicam o valor no resumo do mês.
            </span>
          </label>
        )}

        {recorrente && (
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-5 w-5 accent-verde" />
            Ativo (entra na conta do mês)
          </label>
        )}
        {!recorrente && !entrada && (
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-5 w-5 shrink-0 accent-verde" />
            <span>Usar esta categoria sempre que a descrição tiver este texto</span>
          </label>
        )}

        <button type="submit" className={botao}>Salvar</button>
        {inicial && (
          <button type="button" onClick={() => confirm(`Excluir este ${oQue}?`) && aoExcluir(inicial)} className={`${botaoNeutro} text-alerta`}>
            <Icone nome="lixo" />
            Excluir
          </button>
        )}
      </form>
    </main>
  )
}
