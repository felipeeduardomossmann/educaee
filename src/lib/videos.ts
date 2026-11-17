import type { User } from 'firebase/auth'
import {
  chamarApi,
  consultarRestantesApi,
  lerCodigoErro,
  lerRestantes,
  type CodigoErroApi,
  type Restantes,
} from './api'

// Vídeos: a busca acontece no servidor (/api/videos), com filtros do YouTube e da IA.
// Não guardamos histórico de buscas. Os vídeos escondidos ficam em users/{uid}.

export const TAMANHO_MAXIMO_TERMO = 60

export interface Video {
  id: string
  titulo: string
  canal: string
  duracaoSeg: number
  miniatura: string
}

export const MENSAGENS_ERRO_VIDEOS: Record<CodigoErroApi, string> = {
  'sem-login': 'Sua sessão expirou. Saia e entre de novo para continuar.',
  'dados-invalidos': 'Escreva o que procurar com até 60 caracteres.',
  'limite-dia': 'Você já fez todas as buscas de hoje. Amanhã tem mais!',
  'limite-mes': 'Você já fez todas as buscas deste mês. Elas voltam no dia 1º do mês que vem.',
  'cota-youtube':
    'As buscas de vídeos de hoje acabaram para o site todo. Tente de novo amanhã. Temas já buscados hoje por alguém continuam funcionando.',
  recusado: 'Não foi possível buscar esse tema. Tente outro.',
  falha: 'Não foi possível buscar os vídeos agora. Verifique a internet e tente de novo.',
}

export type ResultadoBusca =
  | { ok: true; videos: Video[]; restantes: Restantes }
  | { ok: false; codigo: CodigoErroApi; restantes?: Restantes }

function lerVideos(dados: unknown): Video[] | null {
  const lista = (dados as { videos?: unknown } | null)?.videos
  if (!Array.isArray(lista)) return null
  return lista.filter(
    (v): v is Video =>
      typeof v?.id === 'string' &&
      /^[A-Za-z0-9_-]{11}$/.test(v.id) &&
      typeof v?.titulo === 'string' &&
      typeof v?.canal === 'string' &&
      typeof v?.duracaoSeg === 'number' &&
      typeof v?.miniatura === 'string' &&
      v.miniatura.startsWith('https://'),
  )
}

export async function buscarVideos(usuario: User, termo: string): Promise<ResultadoBusca> {
  try {
    const { resposta, dados } = await chamarApi(usuario, '/api/videos', { termo })
    const restantes = lerRestantes(dados)
    const videos = lerVideos(dados)
    if (resposta.ok && videos && restantes) return { ok: true, videos, restantes }
    return { ok: false, codigo: lerCodigoErro(dados), restantes }
  } catch {
    return { ok: false, codigo: 'falha' }
  }
}

export function consultarRestantesVideos(usuario: User): Promise<Restantes | null> {
  return consultarRestantesApi(usuario, '/api/videos')
}

/** 200 → "3:20"; 3723 → "1:02:03". */
export function formatarDuracaoVideo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const dois = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`
}

/** Duração por extenso, para leitores de tela: "3 minutos e 20 segundos". */
export function duracaoPorExtenso(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  const partes = []
  if (m > 0) partes.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`)
  if (s > 0 || m === 0) partes.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`)
  return partes.join(' e ')
}

export function semEscondidos(videos: readonly Video[], escondidos: ReadonlySet<string>): Video[] {
  return videos.filter((v) => !escondidos.has(v.id))
}
