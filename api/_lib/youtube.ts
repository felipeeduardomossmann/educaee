// YouTube Data API v3, cota diária do projeto e cache por termo (sem guardar quem buscou).

import { createHash } from 'node:crypto'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { appAdmin } from './firebase-admin.js'
import {
  diaPacifico,
  filtrarDetalhes,
  LIMITE_BUSCAS_YOUTUBE_DIA,
  RESULTADOS_BUSCA,
  VALIDADE_CACHE_MS,
  type Candidato,
  type Video,
} from './videos.js'

const API = 'https://www.googleapis.com/youtube/v3'
const TEMPO_MAXIMO_MS = 15_000

export type ResultadoYoutube =
  { tipo: 'ok'; candidatos: Candidato[] } | { tipo: 'cota-esgotada' } | { tipo: 'falha' }

const banco = () => getFirestore(appAdmin())

function ehCotaEsgotada(dados: unknown): boolean {
  const erros = (dados as { error?: { errors?: { reason?: unknown }[] } } | null)?.error?.errors
  return (
    Array.isArray(erros) &&
    erros.some((e) => e?.reason === 'quotaExceeded' || e?.reason === 'dailyLimitExceeded')
  )
}

async function chamar(caminho: string, parametros: Record<string, string>) {
  const chave = process.env.YOUTUBE_API_KEY
  if (!chave) throw new Error('YOUTUBE_API_KEY não configurada')
  const url = `${API}/${caminho}?${new URLSearchParams({ ...parametros, key: chave })}`
  const resposta = await fetch(url, { signal: AbortSignal.timeout(TEMPO_MAXIMO_MS) })
  const dados: unknown = await resposta.json().catch(() => null)
  return { resposta, dados }
}

/** search.list (seguro, incorporável, Brasil, português) + videos.list para conferir cada um. */
export async function buscarNoYoutube(termoBusca: string): Promise<ResultadoYoutube> {
  try {
    const busca = await chamar('search', {
      part: 'snippet',
      q: termoBusca,
      type: 'video',
      safeSearch: 'strict',
      videoEmbeddable: 'true',
      regionCode: 'BR',
      relevanceLanguage: 'pt',
      maxResults: String(RESULTADOS_BUSCA),
    })
    if (!busca.resposta.ok) {
      if (ehCotaEsgotada(busca.dados)) return { tipo: 'cota-esgotada' }
      console.error('YouTube search: erro', busca.resposta.status)
      return { tipo: 'falha' }
    }
    const itens = (busca.dados as { items?: { id?: { videoId?: unknown } }[] } | null)?.items
    const ids = (itens ?? [])
      .map((i) => i?.id?.videoId)
      .filter((id): id is string => typeof id === 'string')
    if (ids.length === 0) return { tipo: 'ok', candidatos: [] }

    const detalhes = await chamar('videos', {
      part: 'snippet,contentDetails,status',
      id: ids.join(','),
      maxResults: String(ids.length),
    })
    if (!detalhes.resposta.ok) {
      if (ehCotaEsgotada(detalhes.dados)) return { tipo: 'cota-esgotada' }
      console.error('YouTube videos: erro', detalhes.resposta.status)
      return { tipo: 'falha' }
    }
    const lista = (detalhes.dados as { items?: unknown } | null)?.items
    return { tipo: 'ok', candidatos: filtrarDetalhes(lista, ids) }
  } catch (e) {
    console.error('YouTube: sem resposta', e)
    return { tipo: 'falha' }
  }
}

// ---------- Cota diária do search.list (100 por dia no projeto, vira no horário do Pacífico) ----

const docCota = (agora: Date) => banco().collection('usoYoutube').doc(diaPacifico(agora))

/** Conta uma busca no YouTube. false se a cota do dia já acabou. */
export async function reservarCotaYoutube(agora = new Date()): Promise<boolean> {
  const referencia = docCota(agora)
  return banco().runTransaction(async (transacao) => {
    const atual = (await transacao.get(referencia)).get('buscas')
    const buscas = typeof atual === 'number' ? atual : 0
    if (buscas >= LIMITE_BUSCAS_YOUTUBE_DIA) return false
    transacao.set(referencia, { buscas: buscas + 1 }, { merge: true })
    return true
  })
}

/** O YouTube disse que a cota acabou: marca o dia como esgotado. */
export async function marcarCotaEsgotada(agora = new Date()): Promise<void> {
  await docCota(agora).set({ buscas: LIMITE_BUSCAS_YOUTUBE_DIA }, { merge: true })
}

// ---------- Cache por termo (24 h) ----------

const colecaoCache = () => banco().collection('videosCache')

export function idCache(termoNormalizado: string): string {
  return createHash('sha256').update(termoNormalizado).digest('hex').slice(0, 40)
}

function lerVideos(valor: unknown): Video[] | null {
  if (!Array.isArray(valor)) return null
  return valor.filter(
    (v): v is Video =>
      typeof v?.id === 'string' &&
      typeof v?.titulo === 'string' &&
      typeof v?.canal === 'string' &&
      typeof v?.duracaoSeg === 'number' &&
      typeof v?.miniatura === 'string',
  )
}

export async function lerCache(termoNormalizado: string, agora = new Date()) {
  const doc = await colecaoCache().doc(idCache(termoNormalizado)).get()
  const criadoEm = doc.get('criadoEm') as unknown
  if (!(criadoEm instanceof Timestamp)) return null
  if (agora.getTime() - criadoEm.toMillis() > VALIDADE_CACHE_MS) return null
  return lerVideos(doc.get('videos'))
}

export async function gravarCache(termoNormalizado: string, videos: Video[], agora = new Date()) {
  await colecaoCache()
    .doc(idCache(termoNormalizado))
    .set({ videos, criadoEm: Timestamp.fromDate(agora) })
  // Apaga entradas velhas (as políticas do YouTube não deixam guardar por mais de 30 dias).
  const antigas = await colecaoCache()
    .where('criadoEm', '<', Timestamp.fromMillis(agora.getTime() - 2 * VALIDADE_CACHE_MS))
    .limit(20)
    .get()
  await Promise.all(antigas.docs.map((d) => d.ref.delete()))
}
