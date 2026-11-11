const BASE = 'https://api.github.com/repos/n4ttan/organiza-dados/contents/'
const INSCRICOES = BASE + 'inscricoes.json'
const DADOS = BASE + 'dados.json'

const cabecalhos = (token) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' })

// atob/btoa puros corrompem acentos: passa pelos bytes UTF-8.
const decodificar = (b64) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))))
const codificar = (obj) => btoa(Array.from(new TextEncoder().encode(JSON.stringify(obj, null, 2)), (b) => String.fromCharCode(b)).join(''))

const erroToken = () => Object.assign(new Error('Token inválido ou vencido. Cole um token novo em Configuração.'), { token: true })

export function dadosEmCache() {
  try {
    return JSON.parse(localStorage.getItem('dados_cache')) || null
  } catch {
    return null
  }
}

export async function lerDados(token) {
  let resp
  try {
    resp = await fetch(DADOS, { headers: cabecalhos(token), cache: 'no-store' })
  } catch {
    const cache = dadosEmCache()
    if (!cache) throw new Error('Sem conexão e sem dados salvos neste aparelho.')
    return { ...cache, expiraEm: null, offline: true }
  }
  if (resp.status === 401) throw erroToken()
  if (resp.status === 404) throw new Error('dados.json não encontrado (token sem acesso ao organiza-dados?)')
  if (!resp.ok) throw new Error(`GitHub respondeu ${resp.status} ao ler dados.json`)
  const { content, sha } = await resp.json()
  const dados = decodificar(content)
  localStorage.setItem('dados_cache', JSON.stringify({ dados, sha }))
  return { dados, sha, expiraEm: resp.headers.get('github-authentication-token-expiration'), offline: false }
}

export async function gravarDados(token, dados, sha, mensagem) {
  let resp
  try {
    resp = await fetch(DADOS, {
      method: 'PUT',
      headers: cabecalhos(token),
      body: JSON.stringify({ message: mensagem, content: codificar(dados), sha }),
    })
  } catch {
    throw new Error('Sem conexão: a alteração não foi salva.')
  }
  if (resp.status === 401) throw erroToken()
  if (resp.status === 409 || resp.status === 422) {
    throw Object.assign(new Error('Os dados mudaram em outro aparelho. Recarregando.'), { conflito: true })
  }
  if (!resp.ok) throw new Error(`GitHub respondeu ${resp.status} ao gravar dados.json`)
  const novoSha = (await resp.json()).content.sha
  localStorage.setItem('dados_cache', JSON.stringify({ dados, sha: novoSha }))
  return novoSha
}

// Acrescenta (ou substitui, pelo endpoint) a inscrição de push deste aparelho.
export async function gravarInscricao(token, inscricao, aparelho) {
  const headers = cabecalhos(token)

  const lido = await fetch(INSCRICOES, { headers, cache: 'no-store' })
  if (!lido.ok) throw new Error(`GitHub respondeu ${lido.status} ao ler inscricoes.json (token sem acesso ao organiza-dados?)`)
  const { content, sha } = await lido.json()

  const lista = decodificar(content).filter((i) => i.endpoint !== inscricao.endpoint)
  lista.push({ id: crypto.randomUUID(), ...inscricao, aparelho, criadaEm: new Date().toISOString() })

  const gravado = await fetch(INSCRICOES, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Inscricao de push: ${aparelho}`,
      content: codificar(lista),
      sha, // o GitHub recusa (409) se o arquivo mudou no meio
    }),
  })
  if (!gravado.ok) throw new Error(`GitHub respondeu ${gravado.status} ao gravar (o token precisa de Contents: Read and write)`)
}
