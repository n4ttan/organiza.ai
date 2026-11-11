import { useState } from 'react'
import { gravarInscricao } from '../repositorio/github.js'
import { VAPID_PUBLICA } from '../vapid-publica.js'
import { Cabecalho, botao, campo, cartao as base, foco } from './comum.jsx'
import Icone from './icones.jsx'

// Safari exige a chave em bytes, não em base64url.
const emBytes = (b64url) =>
  Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

const temPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const noIphone = /iPhone|iPad/.test(navigator.userAgent)

const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const letrasDias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const padrao = { horas: ['07:30', '19:00'], dias: [0, 1, 2, 3, 4, 5, 6] }

const cartao = `${base} flex flex-col gap-4 p-4`

function Lembretes({ dados, salvar }) {
  const atual = dados.config?.lembretes ?? padrao
  const [horas, setHoras] = useState(atual.horas)
  const [dias, setDias] = useState(atual.dias)

  const gravar = (e) => {
    e.preventDefault()
    const lista = [...new Set(horas.filter(Boolean))].sort()
    if (lista.length === 0) return
    salvar({ ...dados, config: { ...dados.config, lembretes: { horas: lista, dias: [...dias].sort() } } }, 'Lembretes')
  }

  return (
    <form onSubmit={gravar} className={cartao}>
      <h2 className="font-medium">Lembretes</h2>
      <div className="flex flex-col gap-2">
        {horas.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input type="time" required aria-label={`Horário ${i + 1}`} value={h} onChange={(e) => setHoras(horas.map((x, j) => (j === i ? e.target.value : x)))} className={campo} />
            <button type="button" disabled={horas.length === 1} onClick={() => setHoras(horas.filter((_, j) => j !== i))} aria-label={`Remover horário ${i + 1}`} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-linha text-apagado disabled:opacity-70 ${foco}`}>
              <Icone nome="lixo" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setHoras([...horas, '12:00'])} className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-linha ${foco}`}>
          <Icone nome="mais" />
          Adicionar horário
        </button>
      </div>
      <div role="group" aria-label="Dias da semana" className="flex justify-between">
        {letrasDias.map((letra, d) => (
          <button key={d} type="button" aria-label={nomesDias[d]} aria-pressed={dias.includes(d)} onClick={() => setDias(dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d])} className={`h-11 w-11 rounded-full ${dias.includes(d) ? 'bg-verde font-semibold text-fundo' : 'border border-linha text-apagado'} ${foco}`}>
            {letra}
          </button>
        ))}
      </div>
      <p className="text-sm text-apagado">O primeiro horário do dia traz o resumo; os outros avisam só do que vence amanhã. Chega dentro da hora cheia escolhida.</p>
      <button type="submit" className={botao}>Salvar lembretes</button>
    </form>
  )
}

export default function Ajustes({ token, dados, sha, aoSalvarToken, salvar }) {
  const [campoToken, setCampoToken] = useState(token)
  const [estado, setEstado] = useState({ tipo: 'parado', texto: '' })

  async function ativar() {
    try {
      // precisa ser a primeira chamada do toque, senão o iOS não mostra o pedido
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') throw new Error('Notificações bloqueadas. Libere em Ajustes > Notificações > organiza.')
      setEstado({ tipo: 'andando', texto: 'Registrando este aparelho…' })

      const registro = await navigator.serviceWorker.ready
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: emBytes(VAPID_PUBLICA),
      })
      await gravarInscricao(token, inscricao.toJSON(), noIphone ? 'Celular' : 'PC')

      setEstado({ tipo: 'ok', texto: `Aparelho registrado (${new URL(inscricao.endpoint).host}). Feche o app e aguarde o push de teste.` })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho sobre="Este aparelho" titulo="Ajustes" />

      <form onSubmit={(e) => (e.preventDefault(), aoSalvarToken(campoToken.trim()))} className={cartao}>
        <label className="flex flex-col gap-2">
          <span className="font-medium">Token do GitHub (organiza-dados)</span>
          <input type="password" required autoComplete="off" value={campoToken} onChange={(e) => setCampoToken(e.target.value)} placeholder="github_pat_…" className={`${campo}`} />
          <span className="text-sm text-apagado">Fica só neste aparelho.</span>
        </label>
        <button type="submit" className={botao}>Salvar token</button>
      </form>

      <section className={cartao}>
        <h2 className="font-medium">Notificações</h2>
        {!temPush ? (
          <p>
            {noIphone
              ? 'No iPhone o push só funciona com o app instalado: toque em Compartilhar, depois em "Adicionar à Tela de Início", e abra pelo ícone.'
              : 'Este navegador não tem suporte a notificações push.'}
          </p>
        ) : (
          <button type="button" onClick={ativar} disabled={!token || estado.tipo === 'andando'} className={botao}>
            Ativar notificações neste aparelho
          </button>
        )}
        <p role="status" className={estado.tipo === 'erro' ? 'text-alerta' : 'text-apagado'}>
          {estado.texto}
        </p>
      </section>

      {dados && <Lembretes key={sha} dados={dados} salvar={salvar} />}
    </div>
  )
}
