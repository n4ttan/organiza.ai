import { useId, useState } from 'react'
import { desduplicar, parseExtrato } from '../regras/extrato.js'
import { formatarReais } from '../regras/financas.js'
import { hojeEmBrasilia } from '../regras/lembretes.js'
import { botao, botaoNeutro, campo, cartao, dataCurta, foco, lista, rotulo } from './comum.jsx'
import Icone from './icones.jsx'

const nomeConta = (c) => (c.tipo === 'cartao' ? `Cartão ${c.nome}` : c.nome)

export default function ImportarExtrato({ dados, aoSalvar, aoFechar }) {
  const inputArquivoId = useId()
  const contas = dados.contas ?? []
  const regras = dados.config?.regrasCategoria ?? []
  const recorrentes = dados.recorrentes ?? []

  const [contaId, setContaId] = useState(contas[0]?.id ?? '')
  const [textoColado, setTextoColado] = useState('')
  const [mostrarColar, setMostrarColar] = useState(false)
  const [processadas, setProcessadas] = useState([])
  const [duplicadasContagem, setDuplicadasContagem] = useState(0)
  const [selecionados, setSelecionados] = useState(new Set())
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [erro, setErro] = useState('')

  function processarConteudo(texto, nome = '') {
    try {
      setErro('')
      setNomeArquivo(nome)
      const anoPadrao = Number(hojeEmBrasilia().slice(0, 4))
      const extraidas = parseExtrato(texto, {
        anoPadrao,
        regras,
        recorrentes,
        contaId: contaId || null,
      })

      if (extraidas.length === 0) {
        setErro('Nenhuma movimentação financeira reconhecida no texto/arquivo.')
        setProcessadas([])
        setDuplicadasContagem(0)
        setSelecionados(new Set())
        return
      }

      const { unicas, duplicadas } = desduplicar(extraidas, dados.transacoes ?? [])
      setDuplicadasContagem(duplicadas.length)
      setProcessadas(unicas)
      setSelecionados(new Set(unicas.map((t) => t.id)))
    } catch (e) {
      setErro('Erro ao ler extrato: ' + e.message)
    }
  }

  function aoSelecionarArquivo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    const leitor = new FileReader()
    leitor.onload = (evento) => {
      const conteudo = evento.target?.result
      if (typeof conteudo === 'string') {
        processarConteudo(conteudo, arquivo.name)
      }
    }
    leitor.readAsText(arquivo)
  }

  function alternarTodos() {
    if (selecionados.size === processadas.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(processadas.map((t) => t.id)))
    }
  }

  function alternarItem(id) {
    const prox = new Set(selecionados)
    if (prox.has(id)) prox.delete(id)
    else prox.add(id)
    setSelecionados(prox)
  }

  function confirmarImportacao() {
    const paraSalvar = processadas
      .filter((t) => selecionados.has(t.id))
      .map((t) => ({ ...t, contaId: contaId || t.contaId || null }))
    if (paraSalvar.length === 0) return
    aoSalvar(paraSalvar)
  }

  const nomeRecorrente = (recId) => {
    const r = recorrentes.find((x) => x.id === recId)
    return r?.descricao ?? null
  }

  return (
    <main className="topo-seguro mx-auto max-w-md px-4 pb-20 text-tinta">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-verde uppercase">Finanças</p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight">Importar extrato</h1>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className={`flex h-11 w-11 items-center justify-center rounded-xl text-apagado ${foco}`}>
            <Icone nome="fechar" />
          </button>
        </header>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-apagado">Conta padrão de destino</span>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={campo}>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{nomeConta(c)}</option>
            ))}
          </select>
        </label>

        {processadas.length === 0 && (
          <div className="flex flex-col gap-4">
            <div className={`${cartao} flex flex-col items-center gap-3 p-6 text-center border-dashed`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-verde/15 text-verde">
                <Icone nome="upload" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-medium">Carregar arquivo de extrato</p>
                <p className="text-xs text-apagado">CSV ou relatório do Mercado Pago e C6 Bank</p>
              </div>
              <input
                id={inputArquivoId}
                type="file"
                accept=".csv,.txt,.tsv,.md"
                onChange={aoSelecionarArquivo}
                className="sr-only"
              />
              <label htmlFor={inputArquivoId} className={`${botao} mt-2 cursor-pointer`}>
                Escolher arquivo
              </label>
            </div>

            <button
              type="button"
              onClick={() => setMostrarColar((v) => !v)}
              className="text-center text-sm font-medium text-apagado transition-colors hover:text-tinta"
            >
              {mostrarColar ? 'Ocultar colagem de texto' : 'Ou colar texto do extrato'}
            </button>

            {mostrarColar && (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={6}
                  placeholder="Cole aqui o texto ou CSV copiado..."
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  className="w-full rounded-xl border border-linha bg-painel p-3 text-sm text-tinta placeholder:text-apagado focus-visible:outline-2 focus-visible:outline-verde"
                />
                <button
                  type="button"
                  disabled={!textoColado.trim()}
                  onClick={() => processarConteudo(textoColado, 'Texto colado')}
                  className={botaoNeutro}
                >
                  Processar texto
                </button>
              </div>
            )}
          </div>
        )}

        {erro && (
          <p role="alert" className="rounded-xl border border-alerta/40 bg-alerta/10 p-3 text-sm text-alerta">
            {erro}
          </p>
        )}

        {processadas.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className={`${cartao} flex flex-col gap-2 p-4`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{processadas.length} novos lançamentos</p>
                <button
                  type="button"
                  onClick={alternarTodos}
                  className="text-xs font-medium text-verde hover:underline"
                >
                  {selecionados.size === processadas.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>
              {nomeArquivo && <p className="text-xs text-apagado truncate">Fonte: {nomeArquivo}</p>}
              {duplicadasContagem > 0 && (
                <p className="text-xs text-apagado">
                  {duplicadasContagem} já estavam registrados e foram ignorados.
                </p>
              )}
            </div>

            <ul className={lista}>
              {processadas.map((t) => {
                const recNome = t.recorrenteId ? nomeRecorrente(t.recorrenteId) : null
                const marcado = selecionados.has(t.id)
                return (
                  <li key={t.id} className="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors active:bg-relevo">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternarItem(t.id)}
                      aria-label={`Selecionar ${t.descricao}`}
                      className="h-5 w-5 shrink-0 accent-verde"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{t.descricao}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-apagado">
                        <span>{dataCurta(t.data)}</span>
                        <span>·</span>
                        <span className="first-letter:uppercase">{t.categoria}</span>
                        {recNome && (
                          <>
                            <span>·</span>
                            <span className="rounded bg-verde/15 px-1 text-verde">
                              recorrente: {recNome}
                            </span>
                          </>
                        )}
                        {t.categoria === 'pagamento-fatura' && (
                          <span className="rounded bg-relevo px-1 text-apagado">
                            fatura
                          </span>
                        )}
                      </span>
                    </div>
                    <span className={`shrink-0 font-medium tabular-nums ${t.valorCentavos > 0 ? 'text-verde' : ''}`}>
                      {formatarReais(t.valorCentavos)}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setProcessadas([])
                  setSelecionados(new Set())
                  setNomeArquivo('')
                }}
                className={`flex-1 ${botaoNeutro}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selecionados.size === 0}
                onClick={confirmarImportacao}
                className={`flex-2 ${botao}`}
              >
                Importar {selecionados.size} {selecionados.size === 1 ? 'item' : 'itens'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
