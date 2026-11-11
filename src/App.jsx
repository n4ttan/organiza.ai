import { useEffect, useRef, useState } from 'react'
import { dadosEmCache, gravarDados, lerDados } from './repositorio/github.js'
import { hojeEmBrasilia } from './regras/lembretes.js'
import Ajustes from './telas/Ajustes.jsx'
import Faculdade from './telas/Faculdade.jsx'
import Formulario from './telas/Formulario.jsx'
import Hoje from './telas/Hoje.jsx'
import Icone from './telas/icones.jsx'
import Projeto from './telas/Projeto.jsx'
import Projetos from './telas/Projetos.jsx'
import { foco } from './telas/comum.jsx'

const abas = [['hoje', 'Hoje'], ['faculdade', 'Faculdade'], ['projetos', 'Projetos'], ['ajustes', 'Ajustes']]

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') ?? '')
  const [estado, setEstado] = useState(() => dadosEmCache() ?? { dados: null, sha: null })
  const [aba, setAba] = useState('hoje')
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

  function gravarPendencia(p) {
    const existe = dados.pendencias.some((x) => x.id === p.id)
    if (existe) trocarPendencia(p, 'Edita pendencia')
    else salvar({ ...dados, pendencias: [...dados.pendencias, p] }, 'Nova pendencia')
    setForm(null)
  }

  function excluir(p) {
    salvar({ ...dados, pendencias: dados.pendencias.filter((x) => x.id !== p.id) }, 'Exclui pendencia')
    setForm(null)
  }

  function horas(projeto, valor) {
    const n = Number(valor)
    if (valor === '' || !(n >= 0) || n === (projeto.horasFeitas ?? 0)) return
    salvar({ ...dados, projetos: dados.projetos.map((x) => (x.id === projeto.id ? { ...x, horasFeitas: n } : x)) }, 'Horas de estagio')
  }

  if (form && dados) {
    return <Formulario projetos={dados.projetos} inicial={form.pendencia} projetoId={form.projetoId} aoSalvar={gravarPendencia} aoExcluir={excluir} aoFechar={() => setForm(null)} />
  }

  const projeto = projetoId && dados?.projetos.find((p) => p.id === projetoId)
  const editar = (p) => setForm({ pendencia: p })
  let tela = <p className="text-zinc-400">Carregando…</p>
  if (!token || aba === 'ajustes') {
    tela = <Ajustes token={token} dados={dados} sha={estado.sha} aoSalvarToken={salvarToken} salvar={salvar} />
  } else if (dados) {
    if (aba === 'hoje') tela = <Hoje dados={dados} expiraEm={expiraEm} aoAlternar={alternar} aoEditar={editar} />
    else if (projeto) tela = <Projeto projeto={projeto} pendencias={dados.pendencias} aoVoltar={() => setProjetoId(null)} aoAlternar={alternar} aoEditar={editar} aoHoras={horas} />
    else if (aba === 'faculdade') tela = <Faculdade dados={dados} aoAbrir={setProjetoId} />
    else tela = <Projetos dados={dados} aoAbrir={setProjetoId} />
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md text-zinc-50">
      <main className="com-barra flex flex-col gap-4 p-4">
        <div role="status" className="flex flex-col gap-2">
          {offline && <p className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400">Sem conexão: mostrando os dados salvos</p>}
          {msg && <p className="text-red-400">{msg}</p>}
        </div>
        {tela}
      </main>

      {token && (
        <nav aria-label="Principal" className="barra-inferior fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-900">
          <div className="relative mx-auto flex h-16 max-w-md">
            {dados && aba !== 'ajustes' && (
              <button type="button" onClick={() => setForm({ projetoId })} aria-label="Adicionar pendência" className={`absolute right-4 bottom-full mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400 text-zinc-950 ${foco}`}>
                <Icone nome="mais" />
              </button>
            )}
            {abas.map(([id, nome]) => (
              <button
                key={id}
                type="button"
                aria-current={aba === id ? 'page' : undefined}
                onClick={() => (setAba(id), setProjetoId(null))}
                className={`flex flex-1 flex-col items-center justify-center gap-1 text-sm ${aba === id ? 'text-amber-400' : 'text-zinc-400'} ${foco}`}
              >
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
