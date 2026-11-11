// Envia o push de lembretes às inscrições e remove as expiradas (404/410).
// Uso: VAPID_PRIVATE_KEY=... node scripts/notificar.mjs <pasta-dos-dados> [--forcar]
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as webpush from 'web-push'
import { hojeEmBrasilia, lembretesDoDia, mensagemPush, turnoDoEnvio } from '../src/regras/lembretes.js'
import { VAPID_PUBLICA } from '../src/vapid-publica.js'

const pasta = process.argv[2]
const dados = JSON.parse(readFileSync(join(pasta, 'dados.json'), 'utf8'))

const turno = process.argv.includes('--forcar') ? 'resumo' : turnoDoEnvio(dados.config?.lembretes, new Date())
if (!turno) {
  console.log('fora do horário')
  process.exit(0)
}
const mensagem = mensagemPush(lembretesDoDia(dados, hojeEmBrasilia()), turno)
if (!mensagem) {
  console.log('nada a lembrar')
  process.exit(0)
}

const arquivo = join(pasta, 'inscricoes.json')
const inscricoes = JSON.parse(readFileSync(arquivo, 'utf8'))
if (!inscricoes.length) {
  console.log('Nenhuma inscrição em inscricoes.json: ative as notificações no app primeiro.')
  process.exit(0)
}

// A Apple recusa o JWT se o "subject" não for uma URL https ou um mailto válido.
webpush.setVapidDetails('https://n4ttan.github.io/organiza.ai/', VAPID_PUBLICA, process.env.VAPID_PRIVATE_KEY)

const payload = JSON.stringify(mensagem)
const restantes = []
let falhas = 0
for (const inscricao of inscricoes) {
  const { endpoint, keys, aparelho } = inscricao
  const destino = `${aparelho} (${new URL(endpoint).host})`
  try {
    const r = await webpush.sendNotification({ endpoint, keys }, payload)
    console.log(destino, r.statusCode)
    restantes.push(inscricao)
  } catch (erro) {
    console.error(destino, erro.statusCode, erro.body || erro.message)
    if (erro.statusCode === 404 || erro.statusCode === 410) continue
    falhas++
    restantes.push(inscricao)
  }
}
if (restantes.length < inscricoes.length) writeFileSync(arquivo, JSON.stringify(restantes, null, 2) + '\n')
process.exit(falhas ? 1 : 0)
