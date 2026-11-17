// /api/videos: GET = buscas restantes; POST { termo } = até 12 vídeos para crianças.

import { extrairTexto } from './_lib/analise.js'
import { chamarGemini } from './_lib/gemini.js'
import { erro, json, uidDoPedido } from './_lib/http.js'
import { calcularRestantes, LIMITES_VIDEOS } from './_lib/limites.js'
import { criarContador, periodoAtual } from './_lib/uso.js'
import {
  corpoPedidoFiltro,
  lerAprovados,
  limparTermo,
  MAXIMO_VIDEOS,
  normalizarTermo,
  paraVideo,
  termoDeBusca,
} from './_lib/videos.js'
import {
  buscarNoYoutube,
  gravarCache,
  lerCache,
  marcarCotaEsgotada,
  reservarCotaYoutube,
} from './_lib/youtube.js'

const contador = criarContador('usoVideos', LIMITES_VIDEOS)

export async function GET(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)
  const uso = await contador.consultar(uid, periodoAtual())
  return json(calcularRestantes(uso, LIMITES_VIDEOS))
}

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)

  const corpo: unknown = await request.json().catch(() => null)
  const termo = limparTermo((corpo as { termo?: unknown } | null)?.termo)
  const normalizado = termo ? normalizarTermo(termo) : ''
  if (!termo || !normalizado) return erro('dados-invalidos', 400)

  const periodo = periodoAtual()
  const reserva = await contador.reservar(uid, periodo)
  if (!reserva.ok) return erro(reserva.motivo, 429, reserva.uso, LIMITES_VIDEOS)
  const responder = (videos: unknown) =>
    json({ videos, ...calcularRestantes(reserva.uso, LIMITES_VIDEOS) })
  const desistir = async (codigo: 'cota-youtube' | 'falha', status: number) => {
    const uso = await contador.devolver(uid, periodo)
    return erro(codigo, status, uso, LIMITES_VIDEOS)
  }

  // 1) Cache do termo (não gasta cota do YouTube)
  const emCache = await lerCache(normalizado)
  if (emCache) return responder(emCache)

  // 2) YouTube (com a cota diária do projeto)
  if (!(await reservarCotaYoutube())) return desistir('cota-youtube', 429)
  const youtube = await buscarNoYoutube(termoDeBusca(termo))
  if (youtube.tipo === 'cota-esgotada') {
    await marcarCotaEsgotada()
    return desistir('cota-youtube', 429)
  }
  if (youtube.tipo === 'falha') return desistir('falha', 502)

  // 3) Filtro com IA (se falhar, ficam os filtros do YouTube, sem travar)
  const candidatos = youtube.candidatos.slice(0, 30)
  let aprovados = candidatos
  let filtradoPelaIa = false
  if (candidatos.length > 0) {
    const resposta = await chamarGemini(corpoPedidoFiltro(termo, candidatos))
    const daIa =
      resposta.tipo === 'ok' ? lerAprovados(extrairTexto(resposta.dados), candidatos) : null
    if (daIa) {
      aprovados = daIa
      filtradoPelaIa = true
    } else {
      console.warn('Filtro com IA indisponível; usando só os filtros do YouTube')
    }
  }

  const videos = aprovados.slice(0, MAXIMO_VIDEOS).map(paraVideo)
  // Só guarda no cache o resultado que passou pela IA.
  if (filtradoPelaIa) {
    await gravarCache(normalizado, videos).catch((e: unknown) => console.error('Cache', e))
  }
  return responder(videos)
}
