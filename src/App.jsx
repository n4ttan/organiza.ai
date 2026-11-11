import { useState } from 'react'
import { gravarInscricao } from './repositorio/github.js'
import { VAPID_PUBLICA } from './vapid-publica.js'

// Safari exige a chave em bytes, não em base64url.
const emBytes = (b64url) =>
  Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

const temPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const noIphone = /iPhone|iPad/.test(navigator.userAgent)

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') ?? '')
  const [estado, setEstado] = useState({ tipo: 'parado', texto: '' })

  async function ativar(e) {
    e.preventDefault()
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
      await gravarInscricao(token.trim(), inscricao.toJSON(), noIphone ? 'Celular' : 'PC')

      localStorage.setItem('gh_token', token.trim())
      setEstado({ tipo: 'ok', texto: `Aparelho registrado (${new URL(inscricao.endpoint).host}). Feche o app e aguarde o push de teste.` })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4 text-zinc-50">
      <header>
        <h1 className="text-2xl leading-tight font-semibold">organiza.ai</h1>
        <p className="mt-2 text-zinc-400">Teste de notificações. As telas vêm depois que o push chegar neste aparelho.</p>
      </header>

      {!temPush ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          {noIphone
            ? 'No iPhone o push só funciona com o app instalado: toque em Compartilhar, depois em "Adicionar à Tela de Início", e abra pelo ícone.'
            : 'Este navegador não tem suporte a notificações push.'}
        </p>
      ) : (
        <form onSubmit={ativar} className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Token do GitHub (organiza-dados)</span>
            <input
              type="password"
              required
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
              className="h-12 rounded-lg border border-zinc-800 bg-[#0f172a] px-3 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-amber-400"
            />
            <span className="text-sm text-zinc-400">Fica só neste aparelho.</span>
          </label>
          <button
            type="submit"
            disabled={estado.tipo === 'andando'}
            className="h-12 rounded-lg bg-amber-400 font-semibold text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60"
          >
            Ativar notificações
          </button>
        </form>
      )}

      <p role="status" className={estado.tipo === 'erro' ? 'text-red-400' : 'text-zinc-400'}>
        {estado.texto}
      </p>
    </main>
  )
}
