const INSCRICOES = 'https://api.github.com/repos/n4ttan/organiza-dados/contents/inscricoes.json'

// Acrescenta (ou substitui, pelo endpoint) a inscrição de push deste aparelho.
export async function gravarInscricao(token, inscricao, aparelho) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }

  const lido = await fetch(INSCRICOES, { headers, cache: 'no-store' })
  if (!lido.ok) throw new Error(`GitHub respondeu ${lido.status} ao ler inscricoes.json (token sem acesso ao organiza-dados?)`)
  const { content, sha } = await lido.json()

  const lista = JSON.parse(atob(content)).filter((i) => i.endpoint !== inscricao.endpoint)
  lista.push({ id: crypto.randomUUID(), ...inscricao, aparelho, criadaEm: new Date().toISOString() })

  const gravado = await fetch(INSCRICOES, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Inscricao de push: ${aparelho}`,
      content: btoa(JSON.stringify(lista, null, 2)),
      sha, // o GitHub recusa (409) se o arquivo mudou no meio
    }),
  })
  if (!gravado.ok) throw new Error(`GitHub respondeu ${gravado.status} ao gravar (o token precisa de Contents: Read and write)`)
}
