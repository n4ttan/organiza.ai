// Fase 1A: envia um push de teste a todas as inscrições.
// Uso: VAPID_PRIVATE_KEY=... node scripts/notificar.mjs caminho/inscricoes.json
// shortcut: não aplica regras de lembrete nem remove inscrição 404/410; entra na Fase 1B.
import { readFileSync } from 'node:fs'
import * as webpush from 'web-push'
import { VAPID_PUBLICA } from '../src/vapid-publica.js'

// A Apple recusa o JWT se o "subject" não for uma URL https ou um mailto válido.
webpush.setVapidDetails('https://n4ttan.github.io/organiza.ai/', VAPID_PUBLICA, process.env.VAPID_PRIVATE_KEY)

const inscricoes = JSON.parse(readFileSync(process.argv[2], 'utf8'))
if (!inscricoes.length) {
  console.error('Nenhuma inscrição em inscricoes.json: ative as notificações no app primeiro.')
  process.exit(1)
}

const mensagem = JSON.stringify({ titulo: 'organiza.ai', corpo: 'Push de teste. Se chegou com o app fechado, a Fase 1A passou.' })
let falhas = 0
for (const { endpoint, keys, aparelho } of inscricoes) {
  const destino = `${aparelho} (${new URL(endpoint).host})`
  try {
    const r = await webpush.sendNotification({ endpoint, keys }, mensagem)
    console.log(destino, r.statusCode)
  } catch (erro) {
    falhas++
    console.error(destino, erro.statusCode, erro.body || erro.message)
  }
}
process.exit(falhas ? 1 : 0)
