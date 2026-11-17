// Fala gravada no servidor (Gemini TTS, voz pt-br-tutor-4), em MP3 pequeno (cartões da prancha).
// Mesmo modelo, voz, estilo e formato das falas do catálogo (scripts/gerar-falas.mjs).

import { Mp3Encoder } from '@breezystack/lamejs'
import { chamarGemini } from './gemini.js'

const MODELO_VOZ = 'gemini-3.8-flash-tts'
const VOZ = 'pt-br-tutor-4'
const ESTILO =
  'Fale em português do Brasil, com voz calma, carinhosa e clara, em ritmo pausado, como uma professora falando com uma criança pequena.'
const TAXA = 24000
const KBPS = 40

export function corpoPedidoFala(texto: string) {
  return {
    model: MODELO_VOZ,
    store: false,
    input: [
      {
        type: 'user_input',
        content: [
          { type: 'text', text: texto, annotations: [{ type: 'speech_metadata', style: ESTILO }] },
        ],
      },
    ],
    response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: TAXA },
    generation_config: { speech_config: [{ voice: VOZ }] },
  }
}

/** Amostras PCM 16 bits do WAV (pedaço "data"). */
export function lerWav(bytes: Uint8Array): Int16Array {
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let pos = 12
  while (pos + 8 <= bytes.length) {
    const nome = String.fromCharCode(...bytes.subarray(pos, pos + 4))
    const tamanho = visao.getUint32(pos + 4, true)
    if (nome === 'data') {
      const fim = Math.min(bytes.length, pos + 8 + tamanho)
      const copia = bytes.slice(pos + 8, fim - ((fim - pos - 8) % 2))
      return new Int16Array(copia.buffer)
    }
    pos += 8 + tamanho + (tamanho % 2)
  }
  throw new Error('WAV sem dados')
}

/** Tira o silêncio das pontas, deixando uma folga curta. */
export function cortarSilencio(amostras: Int16Array): Int16Array {
  const limiar = 350
  const folga = Math.round(TAXA * 0.12)
  let inicio = 0
  while (inicio < amostras.length && Math.abs(amostras[inicio] ?? 0) < limiar) inicio++
  let fim = amostras.length - 1
  while (fim > inicio && Math.abs(amostras[fim] ?? 0) < limiar) fim--
  return amostras.slice(Math.max(0, inicio - folga), Math.min(amostras.length, fim + folga))
}

export function paraMp3(amostras: Int16Array): Uint8Array {
  const codificador = new Mp3Encoder(1, TAXA, KBPS)
  const partes: Uint8Array[] = []
  for (let i = 0; i < amostras.length; i += 1152) {
    partes.push(codificador.encodeBuffer(amostras.subarray(i, i + 1152)))
  }
  partes.push(codificador.flush())
  const total = partes.reduce((n, p) => n + p.length, 0)
  const saida = new Uint8Array(total)
  let pos = 0
  for (const p of partes) {
    saida.set(p, pos)
    pos += p.length
  }
  return saida
}

/** Grava a fala e devolve um data URL MP3, ou null se não der (aí vale a voz do navegador). */
export async function gravarFala(texto: string): Promise<string | null> {
  const resposta = await chamarGemini(corpoPedidoFala(texto))
  if (resposta.tipo !== 'ok') return null
  const passos = (resposta.dados as { steps?: { content?: { type?: string; data?: string }[] }[] })
    ?.steps
  const audio = passos?.flatMap((s) => s.content ?? []).find((c) => c.type === 'audio')?.data
  if (!audio) return null
  try {
    const mp3 = paraMp3(cortarSilencio(lerWav(Buffer.from(audio, 'base64'))))
    return `data:audio/mpeg;base64,${Buffer.from(mp3).toString('base64')}`
  } catch (e) {
    console.error('TTS: áudio inválido', e)
    return null
  }
}
