import { temFalasGravadas, urlDaFala } from '../audio/falas'
import { VELOCIDADE_FALA, type VelocidadeVoz } from './perfil'

/** O mínimo de SpeechSynthesisVoice que usamos (facilita os testes). */
export interface VozDisponivel {
  lang: string
  localService: boolean
  default: boolean
  name: string
}

function ehPortuguesBrasil(lang: string): boolean {
  return lang.replace('_', '-').toLowerCase() === 'pt-br'
}

/** Qualidade da voz: 3 Microsoft Natural, 2 Google pt-BR, 1 outras on-line, 0 locais. */
function qualidade(voz: VozDisponivel): number {
  const nome = voz.name.toLowerCase()
  if (nome.includes('microsoft') && (nome.includes('natural') || nome.includes('online'))) return 3
  if (nome.includes('google')) return 2
  return voz.localService ? 0 : 1
}

/** Vozes em português, da melhor para a pior. pt-BR sempre antes de outros "pt". */
export function ordenarVozes<V extends VozDisponivel>(vozes: readonly V[]): V[] {
  return vozes
    .filter((voz) => voz.lang.replace('_', '-').toLowerCase().startsWith('pt'))
    .sort(
      (a, b) =>
        Number(ehPortuguesBrasil(b.lang)) - Number(ehPortuguesBrasil(a.lang)) ||
        qualidade(b) - qualidade(a) ||
        Number(b.default) - Number(a.default),
    )
}

export interface VozesEscolhidas<V> {
  /** A melhor voz disponível (pode depender de internet). */
  preferida: V | null
  /** A melhor voz instalada no aparelho: reserva para falhas e uso offline. */
  local: V | null
}

export function escolherVozes<V extends VozDisponivel>(vozes: readonly V[]): VozesEscolhidas<V> {
  const ordenadas = ordenarVozes(vozes)
  return {
    preferida: ordenadas[0] ?? null,
    local: ordenadas.find((voz) => voz.localService) ?? null,
  }
}

const sintese = typeof window !== 'undefined' ? window.speechSynthesis : undefined

// Se a fala não começar neste tempo, a voz on-line provavelmente travou (sem internet).
const ESPERA_INICIO_MS = 3000

/** A lista de vozes do Chrome chega depois de a página carregar: espera por ela. */
function carregarVozes(): Promise<SpeechSynthesisVoice[]> {
  if (!sintese) return Promise.resolve([])
  const vozes = sintese.getVoices()
  if (vozes.length > 0) return Promise.resolve(vozes)
  return new Promise((resolver) => {
    const pronto = () => resolver(sintese.getVoices())
    sintese.addEventListener('voiceschanged', pronto, { once: true })
    // Alguns sistemas não têm vozes e nunca disparam o evento.
    setTimeout(pronto, 1500)
  })
}

let vozes: Promise<VozesEscolhidas<SpeechSynthesisVoice>> | null = null
// Depois que a voz preferida falha, usa a local até a internet voltar.
let preferidaFalhou = false
// Cada nova fala invalida as anteriores (para uma fala antiga não "voltar" na reserva).
let geracao = 0

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    preferidaFalhou = false
  })
}

function obterVozes(): Promise<VozesEscolhidas<SpeechSynthesisVoice>> {
  vozes ??= carregarVozes().then(escolherVozes)
  return vozes
}

/** true se dá para ler as instruções: há falas gravadas ou uma voz em português no aparelho. */
export async function temVozPortugues(): Promise<boolean> {
  return temFalasGravadas() || (await obterVozes()).preferida !== null
}

// ---------- Falas gravadas (voz principal) ----------

/** A gravação já é pausada; "normal" acelera um pouco, sem mudar o tom. */
const RITMO_GRAVACAO: Record<VelocidadeVoz, number> = { lenta: 1, normal: 1.15 }

let audioAtual: { audio: HTMLAudioElement; terminar: (sucesso: boolean) => void } | null = null

function pararAudio() {
  if (!audioAtual) return
  const { audio, terminar } = audioAtual
  audioAtual = null
  audio.pause()
  terminar(true)
}

/** Toca a gravação. true se tocou até o fim (ou foi parada de propósito), false se falhou. */
function tocarGravacao(url: string, velocidade: VelocidadeVoz): Promise<boolean> {
  return new Promise((resolver) => {
    let terminou = false
    const audio = new Audio(url)
    const terminar = (sucesso: boolean) => {
      if (terminou) return
      terminou = true
      if (audioAtual?.audio === audio) audioAtual = null
      resolver(sucesso)
    }
    audio.playbackRate = RITMO_GRAVACAO[velocidade]
    audio.preservesPitch = true
    audio.onended = () => terminar(true)
    audio.onerror = () => terminar(false)
    audioAtual = { audio, terminar }
    audio.play().catch(() => terminar(false))
  })
}

/** Tenta falar com uma voz. true se falou (ou foi interrompida de propósito), false se falhou. */
function tentarFalar(
  texto: string,
  velocidade: VelocidadeVoz,
  voz: SpeechSynthesisVoice | null,
): Promise<boolean> {
  if (!sintese) return Promise.resolve(true)
  return new Promise((resolver) => {
    let terminou = false
    const terminar = (sucesso: boolean) => {
      if (terminou) return
      terminou = true
      window.clearTimeout(espera)
      resolver(sucesso)
    }
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = 'pt-BR'
    fala.rate = VELOCIDADE_FALA[velocidade]
    if (voz) fala.voice = voz
    fala.onstart = () => window.clearTimeout(espera)
    fala.onend = () => terminar(true)
    fala.onerror = (evento) =>
      // "interrupted"/"canceled" = outra fala começou ou pararFala(): não é falha da voz.
      terminar(evento.error === 'interrupted' || evento.error === 'canceled')
    const espera = window.setTimeout(() => {
      sintese.cancel()
      terminar(false)
    }, ESPERA_INICIO_MS)
    sintese.speak(fala)
  })
}

/** Fala em pt-BR: gravação MP3 se houver; senão, a melhor voz do navegador. */
export async function falar(texto: string, velocidade: VelocidadeVoz): Promise<void> {
  const minhaGeracao = ++geracao
  pararAudio()
  sintese?.cancel()
  // 1) A fala gravada (igual em todos os navegadores e offline)
  const url = urlDaFala(texto)
  if (url && (await tocarGravacao(url, velocidade))) return
  if (minhaGeracao !== geracao) return
  // 2) Reserva: a voz do navegador
  if (!sintese) return
  const { preferida, local } = await obterVozes()
  if (minhaGeracao !== geracao) return
  sintese.cancel()

  const usarLocal = preferida !== local && (preferidaFalhou || !navigator.onLine)
  const primeira = usarLocal && local ? local : preferida
  const falou = await tentarFalar(texto, velocidade, primeira)

  if (!falou && primeira !== local && minhaGeracao === geracao) {
    preferidaFalhou = true
    await tentarFalar(texto, velocidade, local)
  }
}

/** Toca um áudio próprio; sem ele, fala o texto. */
export async function falarAudio(
  url: string | null | undefined,
  texto: string,
  velocidade: VelocidadeVoz,
): Promise<void> {
  if (!url) return falar(texto, velocidade)
  const minhaGeracao = ++geracao
  pararAudio()
  sintese?.cancel()
  if (await tocarGravacao(url, velocidade)) return
  if (minhaGeracao === geracao) await falar(texto, velocidade)
}

export function pararFala(): void {
  geracao++
  pararAudio()
  sintese?.cancel()
}
