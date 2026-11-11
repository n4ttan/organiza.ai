import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dadosEmCache, gravarDados, lerDados } from './github'

const resposta = (status, corpo, headers = {}) => ({
  ok: status < 400,
  status,
  json: async () => corpo,
  headers: { get: (k) => headers[k] ?? null },
})

beforeEach(() => {
  const mem = {}
  vi.stubGlobal('localStorage', { getItem: (k) => mem[k] ?? null, setItem: (k, v) => (mem[k] = v) })
})

describe('github', () => {
  it('ida e volta preserva acentos', async () => {
    const dados = { cat: 'Eletrônica', nota: 'ação' }
    let enviado
    vi.stubGlobal('fetch', async (url, op) => {
      if (op?.method === 'PUT') {
        enviado = JSON.parse(op.body).content
        return resposta(200, { content: { sha: 'novo' } })
      }
      return resposta(200, { content: enviado, sha: 'novo' }, { 'github-authentication-token-expiration': 'amanhã' })
    })
    expect(await gravarDados('t', dados, 'velho', 'msg')).toBe('novo')
    const lido = await lerDados('t')
    expect(lido).toEqual({ dados, sha: 'novo', expiraEm: 'amanhã', offline: false })
  })

  it('409 vira conflito e não mexe no cache', async () => {
    localStorage.setItem('dados_cache', '{"dados":1,"sha":"a"}')
    vi.stubGlobal('fetch', async () => resposta(409, {}))
    await expect(gravarDados('t', { x: 2 }, 'a', 'm')).rejects.toMatchObject({ conflito: true })
    expect(dadosEmCache()).toEqual({ dados: 1, sha: 'a' })
  })

  it('sem rede devolve o cache offline', async () => {
    localStorage.setItem('dados_cache', '{"dados":1,"sha":"a"}')
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('falhou')
    })
    expect(await lerDados('t')).toEqual({ dados: 1, sha: 'a', expiraEm: null, offline: true })
  })
})
