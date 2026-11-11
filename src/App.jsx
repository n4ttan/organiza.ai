import { useEffect, useRef, useState } from 'react'
import { dadosEmCache, gravarDados, lerDados } from './repositorio/github.js'
import { hojeEmBrasilia } from './regras/lembretes.js'
import Ajustes from './telas/Ajustes.jsx'
import Faculdade from './telas/Faculdade.jsx'
import Financas from './telas/Financas.jsx'
import FormularioFinancas from './telas/FormularioFinancas.jsx'
import Formulario from './telas/Formulario.jsx'
import Hoje from './telas/Hoje.jsx'
import Icone from './telas/icones.jsx'
import ImportarExtrato from './telas/ImportarExtrato.jsx'
import Projeto from './telas/Projeto.jsx'
import Projetos from './telas/Projetos.jsx'
import { foco } from './telas/comum.jsx'

const abas = [['hoje', 'Hoje'], ['faculdade', 'Faculdade'], ['projetos', 'Projetos'], ['financas', 'Finanças']]
const abaInicial = () => [...abas.map(([id]) => id), 'ajustes'].find((id) => id === location.hash.slice(1)) ?? 'hoje'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') ?? '')
  const [estado, setEstado] = useState(() => dadosEmCache() ?? { dados: null, sha: null })
  const [aba, setAba] = useState(abaInicial)
  const [offline, setOffline] = useState(false)
  const [expiraEm, setExpiraEm] = useState(null)
  const [msg, setMsg] = useState('')
  const [projetoId, setProjetoId] = useState(null)
  const [form, setForm] = useState(null)
  const fila = useRef(Promise.resolve())
  const shaRef = useRef(estado.sha)

  // leituras e gravações entram na mesma fila: cada gravação usa o sha devolvido pela anterior
  const enfileirar = (fn) => {
    fila.current = fila.current.then(fn)
  }

  async function ler(t) {
    try {
      const r = await lerDados(t)
      shaRef.current = r.sha
      setEstado({ dados: r.dados, sha: r.sha })
      setOffline(r.offline)
      if (!r.offline) setExpiraEm(r.expiraEm)
    } catch (erro) {
      if (erro.token) setAba('ajustes')
      setMsg(erro.message)
    }
  }

  const carregar = (t) =>
    enfileirar(async () => {
      setMsg('')
      await ler(t)
    })

  useEffect(() => {
    if (!token) return
    carregar(token)
    const aoVoltar = () => document.visibilityState === 'visible' && carregar(token)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [token])

  function salvar(dados, mensagem) {
    setMsg('')
    setEstado((e) => ({ ...e, dados }))
    enfileirar(async () => {
      try {
        shaRef.current = await gravarDados(token, dados, shaRef.current, mensagem)
        setEstado((e) => ({ ...e, sha: shaRef.current }))
        setOffline(false)
      } catch (erro) {
        if (erro.token) setAba('ajustes')
        await ler(token) // desfaz a alteração otimista (ou traz a versão do outro aparelho)
        setMsg(erro.message)
      }
    })
  }

  function salvarToken(novo) {
    localStorage.setItem('gh_token', novo)
    setMsg('')
    if (novo === token) carregar(novo)
    else setToken(novo)
  }

  const dados = estado.dados && { ...estado.dados, pendencias: estado.dados.pendencias ?? [], projetos: estado.dados.projetos ?? [] }
  const trocarPendencia = (p, mensagem) => salvar({ ...dados, pendencias: dados.pendencias.map((x) => (x.id === p.id ? p : x)) }, mensagem)

  function alternar(p) {
    const { feitaEm, ...resto } = p
    if (p.status === 'feita') trocarPendencia({ ...resto, status: 'aberta' }, 'Reabre pendencia')
    else trocarPendencia({ ...p, status: 'feita', feitaEm: hojeEmBrasilia() }, 'Conclui pendencia')
  }

  // pendencias, transacoes e recorrentes: mesma gravação por id
  function gravarEm(chave, item, mensagem, extra) {
    const atual = dados[chave] ?? []
    const nova = atual.some((x) => x.id === item.id) ? atual.map((x) => (x.id === item.id ? item : x)) : [...atual, item]
    salvar({ ...dados, ...extra, [chave]: nova }, mensagem)
    setForm(null)
  }

  function excluirDe(chave, item, mensagem) {
    salvar({ ...dados, [chave]: (dados[chave] ?? []).filter((x) => x.id !== item.id) }, mensagem)
    setForm(null)
  }

  function fatura(contaId, mes, centavos) {
    const conta = dados.contas.find((c) => c.id === contaId)
    if (centavos === (conta.faturas?.[mes] ?? null)) return
    const { [mes]: _, ...faturas } = conta.faturas ?? {}
    if (centavos != null) faturas[mes] = centavos
    salvar({ ...dados, contas: dados.contas.map((c) => (c.id === contaId ? { ...c, faturas } : c)) }, 'Valor de fatura')
  }

  function horas(projeto, valor) {
    const n = Number(valor)
    if (valor === '' || !(n >= 0) || n === (projeto.horasFeitas ?? 0)) return
    salvar({ ...dados, projetos: dados.projetos.map((x) => (x.id === projeto.id ? { ...x, horasFeitas: n } : x)) }, 'Horas de estagio')
  }

  if (form && dados) {
    const fechar = () => setForm(null)
    if (form.tipo === 'importar-extrato') {
      return (
        <ImportarExtrato
          dados={dados}
          aoSalvar={(novas) => {
            salvar(
              { ...dados, transacoes: [...(dados.transacoes ?? []), ...novas] },
              `Importar ${novas.length} transacoes de extrato`
            )
            fechar()
          }}
          aoFechar={fechar}
        />
      )
    }
    if (form.tipo) {
      const chave = form.tipo === 'recorrente' ? 'recorrentes' : 'transacoes'
      const comRegra = (regra) => regra && { config: { ...dados.config, regrasCategoria: [...(dados.config?.regrasCategoria ?? []), regra] } }
      return <FormularioFinancas modo={form.tipo} inicial={form.item} dados={dados} aoSalvar={(item, regra) => gravarEm(chave, item, `Grava ${form.tipo}`, comRegra(regra))} aoExcluir={(item) => excluirDe(chave, item, `Exclui ${form.tipo}`)} aoFechar={fechar} />
    }
    return <Formulario projetos={dados.projetos} inicial={form.pendencia} projetoId={form.projetoId} aoSalvar={(p) => gravarEm('pendencias', p, 'Grava pendencia')} aoExcluir={(p) => excluirDe('pendencias', p, 'Exclui pendencia')} aoFechar={fechar} />
  }

  const projeto = projetoId && dados?.projetos.find((p) => p.id === projetoId)
  const editar = (p) => setForm({ pendencia: p })
  let tela = <p className="text-apagado">Carregando…</p>
  if (!token || aba === 'ajustes') {
    tela = <Ajustes token={token} dados={dados} sha={estado.sha} aoSalvarToken={salvarToken} salvar={salvar} />
  } else if (dados) {
    if (aba === 'hoje') tela = <Hoje dados={dados} expiraEm={expiraEm} aoAlternar={alternar} aoEditar={editar} />
    else if (projeto) tela = <Projeto projeto={projeto} pendencias={dados.pendencias} aoVoltar={() => setProjetoId(null)} aoAlternar={alternar} aoEditar={editar} aoHoras={horas} />
    else if (aba === 'faculdade') tela = <Faculdade dados={dados} aoAbrir={setProjetoId} />
    else if (aba === 'financas') tela = <Financas dados={dados} aoLancamento={(item) => setForm({ tipo: 'lancamento', item })} aoRecorrente={(item) => setForm({ tipo: 'recorrente', item })} aoFatura={fatura} aoImportar={() => setForm({ tipo: 'importar-extrato' })} />
    else tela = <Projetos dados={dados} aoAbrir={setProjetoId} />
  }

  const irPara = (id) => (setAba(id), setProjetoId(null), history.replaceState(null, '', '#' + id), scrollTo(0, 0))
  const financas = aba === 'financas'

  return (
    <div className="mx-auto min-h-dvh max-w-md text-tinta">
      <main className="topo-seguro com-barra flex flex-col gap-4 px-4">
        <div role="status" className="flex flex-col gap-2 empty:hidden">
          {offline && <p className="rounded-xl border border-linha bg-painel px-3 py-2 text-sm text-apagado">Sem conexão: mostrando os dados salvos</p>}
          {msg && <p className="rounded-xl border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">{msg}</p>}
        </div>
        <div className="relative">
          {token && (
            <button type="button" onClick={() => irPara('ajustes')} aria-label="Ajustes" aria-current={aba === 'ajustes' ? 'page' : undefined} className={`absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border border-linha bg-painel transition-colors active:bg-relevo ${aba === 'ajustes' ? 'text-verde' : 'text-apagado'} ${foco}`}>
              <Icone nome="ajustes" tamanho={20} />
            </button>
          )}
          {tela}
        </div>
      </main>

      {token && (
        <nav aria-label="Principal" className="barra-inferior fixed inset-x-0 bottom-0 border-t border-linha bg-fundo/85 backdrop-blur-md">
          <div className="relative mx-auto flex h-16 max-w-md">
            {dados && aba !== 'ajustes' && (
              <button type="button" onClick={() => setForm(financas ? { tipo: 'lancamento' } : { projetoId })} aria-label={financas ? 'Adicionar lançamento' : 'Adicionar pendência'} className={`absolute right-4 bottom-full mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-verde text-fundo shadow-lg shadow-verde/20 transition-transform active:scale-95 ${foco}`}>
                <Icone nome="mais" />
              </button>
            )}
            {abas.map(([id, nome]) => (
              <button key={id} type="button" aria-current={aba === id ? 'page' : undefined} onClick={() => irPara(id)} className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${aba === id ? 'text-verde' : 'text-apagado'} ${foco}`}>
                {aba === id && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-verde" />}
                <Icone nome={id} />
                {nome}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
