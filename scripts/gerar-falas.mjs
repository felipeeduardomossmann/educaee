// Grava em MP3 (Gemini TTS) as falas do catálogo que ainda não têm áudio.
// Uso: node scripts/gerar-falas.mjs [--listar | --teste | --lote=N]
// Várias falas vão num pedido só e o áudio é cortado pelas pausas (scripts/falas-lote.mjs).

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Mp3Encoder } from '@breezystack/lamejs'
import { createServer } from 'vite'
import { cortarLote, plausivel, textoDoLote } from './falas-lote.mjs'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const pasta = fileURLToPath(new URL('../src/assets/falas/', import.meta.url))

const MODELO = 'gemini-3.8-flash-tts'
const VOZ = 'pt-br-tutor-4'
const ESTILO =
  'Fale em português do Brasil, com voz calma, carinhosa e clara, em ritmo pausado, como uma professora falando com uma criança pequena.'
const TAXA = 24000
const KBPS = 40
// O modelo aceita 10 pedidos por minuto: um a cada 6,5 s.
const INTERVALO_MS = 6500

const ESTILO_LOTE = `${ESTILO} Cada linha é uma frase separada: leia na ordem e faça uma pausa longa, de uns dois segundos, entre as linhas. Não leia números nem marcações.`
const listar = process.argv.includes('--listar')
const teste = process.argv.includes('--teste')
const TAMANHO_LOTE = teste
  ? 5
  : Number(process.argv.find((a) => a.startsWith('--lote='))?.slice(7) ?? 16) || 16
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function carregarCatalogo() {
  const vite = await createServer({
    root: raiz,
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, entries: [] },
  })
  try {
    const { falasDoSite } = await vite.ssrLoadModule('/src/audio/catalogo.ts')
    const { idFala } = await vite.ssrLoadModule('/src/audio/hash.ts')
    return falasDoSite().map((texto) => ({ texto, id: idFala(texto) }))
  } finally {
    await vite.close()
  }
}

/** WAV (RIFF, PCM 16 bits mono) → amostras. */
function lerWav(bytes) {
  let pos = 12
  while (pos + 8 <= bytes.length) {
    const nome = bytes.toString('ascii', pos, pos + 4)
    const tamanho = bytes.readUInt32LE(pos + 4)
    if (nome === 'data') {
      const fim = Math.min(bytes.length, pos + 8 + tamanho)
      return new Int16Array(bytes.buffer.slice(bytes.byteOffset + pos + 8, bytes.byteOffset + fim))
    }
    pos += 8 + tamanho + (tamanho % 2)
  }
  throw new Error('WAV sem dados')
}

/** Tira o silêncio das pontas, deixando uma folga curta (a fala começa logo ao tocar). */
function cortarSilencio(amostras) {
  const limiar = 350
  const folga = Math.round(TAXA * 0.12)
  let inicio = 0
  while (inicio < amostras.length && Math.abs(amostras[inicio]) < limiar) inicio++
  let fim = amostras.length - 1
  while (fim > inicio && Math.abs(amostras[fim]) < limiar) fim--
  return amostras.slice(Math.max(0, inicio - folga), Math.min(amostras.length, fim + folga))
}

function paraMp3(amostras) {
  const codificador = new Mp3Encoder(1, TAXA, KBPS)
  const partes = []
  for (let i = 0; i < amostras.length; i += 1152) {
    partes.push(codificador.encodeBuffer(amostras.subarray(i, i + 1152)))
  }
  partes.push(codificador.flush())
  return Buffer.concat(partes.map((p) => Buffer.from(p.buffer, p.byteOffset, p.length)))
}

class LimiteDiario extends Error {}

async function sintetizar(texto, estilo = ESTILO) {
  const corpo = {
    model: MODELO,
    store: false,
    input: [
      {
        type: 'user_input',
        content: [
          { type: 'text', text: texto, annotations: [{ type: 'speech_metadata', style: estilo }] },
        ],
      },
    ],
    response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: TAXA },
    generation_config: { speech_config: [{ voice: VOZ }] },
  }
  // Esperar pelo limite de pedidos não conta como tentativa (até 15 esperas por fala).
  let esperasPeloLimite = 0
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const resposta = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const dados = await resposta.json().catch(() => null)
    if (resposta.ok) {
      const audio = dados?.steps?.flatMap((s) => s.content ?? []).find((c) => c.type === 'audio')
      if (audio?.data) return Buffer.from(audio.data, 'base64')
      console.warn(`  sem áudio na resposta (tentativa ${tentativa})`)
    } else if (resposta.status === 429 && /per day/i.test(dados?.error?.message ?? '')) {
      // Limite diário do modelo (100 pedidos por dia no Tier 1): não adianta insistir hoje.
      throw new LimiteDiario(dados.error.message)
    } else if (resposta.status === 429) {
      const segundos = Number(/retry in (\d+)/i.exec(dados?.error?.message ?? '')?.[1] ?? 60)
      console.warn(`  limite de pedidos: esperando ${segundos + 2} s`)
      await espera((segundos + 2) * 1000)
      if (++esperasPeloLimite <= 15) tentativa--
      continue
    } else {
      console.warn(
        `  erro ${resposta.status} (tentativa ${tentativa}): ${dados?.error?.message ?? ''}`,
      )
    }
    await espera(INTERVALO_MS * tentativa)
  }
  return null
}

async function principal() {
  process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)))
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não está no .env.local')
  mkdirSync(pasta, { recursive: true })

  const catalogo = await carregarCatalogo()
  const ids = new Set(catalogo.map((f) => f.id))
  // Registro legível de qual texto é cada arquivo (útil para revisar e para o git).
  const registro = Object.fromEntries(
    [...catalogo]
      .sort((a, b) => a.texto.localeCompare(b.texto, 'pt-BR'))
      .map((f) => [f.id, f.texto]),
  )
  writeFileSync(`${pasta}catalogo.json`, `${JSON.stringify(registro, null, 2)}\n`)

  // Apaga áudios de falas que saíram do catálogo.
  const sobras = readdirSync(pasta).filter((f) => f.endsWith('.mp3') && !ids.has(f.slice(0, -4)))
  if (!listar) for (const f of sobras) rmSync(`${pasta}${f}`)

  const faltando = catalogo.filter((f) => !existsSync(`${pasta}${f.id}.mp3`))
  console.log(
    `${catalogo.length} falas no catálogo, ${catalogo.length - faltando.length} já gravadas, ` +
      `${faltando.length} para gravar` +
      (sobras.length ? `, ${sobras.length} sobras ${listar ? 'a apagar' : 'apagadas'}` : ''),
  )
  if (listar) {
    for (const f of faltando) console.log(`  ${f.id}  ${f.texto}`)
    return
  }

  // Fila de lotes; um lote que não deu certo volta para a fila dividido ao meio.
  const fila = []
  const lista = teste ? faltando.slice(0, TAMANHO_LOTE) : faltando
  for (let i = 0; i < lista.length; i += TAMANHO_LOTE) fila.push(lista.slice(i, i + TAMANHO_LOTE))
  const folga = Math.round(TAXA * 0.12)
  let gravadas = 0
  let falhas = 0
  let pedidos = 0
  const salvar = (fala, amostras) => {
    const mp3 = paraMp3(amostras)
    writeFileSync(`${pasta}${fala.id}.mp3`, mp3)
    gravadas++
    const segundos = (amostras.length / TAXA).toFixed(1)
    console.log(`  ${fala.id} (${segundos} s, ${(mp3.length / 1024).toFixed(1)} KB) ${fala.texto}`)
  }

  while (fila.length > 0) {
    const lote = fila.shift()
    const inicio = Date.now()
    console.log(
      `Pedido ${pedidos + 1}: ${lote.length} ${lote.length === 1 ? 'fala' : 'falas'} (faltam ${fila.reduce((n, l) => n + l.length, lote.length)})`,
    )
    let wav
    try {
      wav =
        lote.length === 1
          ? await sintetizar(lote[0].texto)
          : await sintetizar(textoDoLote(lote.map((f) => f.texto)), ESTILO_LOTE)
      pedidos++
    } catch (e) {
      if (!(e instanceof LimiteDiario)) throw e
      console.error(`Limite diário do modelo de voz atingido: ${e.message}`)
      console.error(
        `Nesta rodada: ${gravadas} gravadas em ${pedidos} pedidos. Rode de novo depois (é incremental).`,
      )
      process.exitCode = 2
      return
    }

    if (!wav) {
      if (lote.length > 1) fila.unshift(lote.slice(0, lote.length / 2), lote.slice(lote.length / 2))
      else {
        falhas++
        console.error(`  FALHOU: ${lote[0].texto}`)
      }
    } else if (lote.length === 1) {
      salvar(lote[0], cortarSilencio(lerWav(wav)))
    } else {
      const amostras = lerWav(wav)
      const trechos = cortarLote(amostras, TAXA, lote.length)
      const textos = lote.map((f) => f.texto)
      if (trechos && plausivel(trechos, textos, TAXA)) {
        trechos.forEach(({ inicio: a, fim: b }, i) =>
          salvar(
            lote[i],
            amostras.slice(Math.max(0, a - folga), Math.min(amostras.length, b + folga)),
          ),
        )
      } else {
        // Contagem ou durações não bateram: refaz em dois lotes menores.
        console.warn(
          `  o corte não bateu (${trechos ? 'durações' : 'número de trechos'}); dividindo o lote`,
        )
        const meio = Math.ceil(lote.length / 2)
        fila.unshift(lote.slice(0, meio), lote.slice(meio))
      }
    }
    const restante = INTERVALO_MS - (Date.now() - inicio)
    if (restante > 0 && fila.length > 0) await espera(restante)
  }
  console.log(`Pronto: ${gravadas} gravadas em ${pedidos} pedidos, ${falhas} falhas.`)
  if (teste) console.log('Teste: ouça os arquivos listados acima antes de rodar sem --teste.')
  if (falhas > 0) process.exitCode = 1
}

await principal()
