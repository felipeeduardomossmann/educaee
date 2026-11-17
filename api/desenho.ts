// /api/desenho: GET = desenhos restantes; POST { tema } = 1 desenho para colorir.

import { corpoPedido, extrairImagem, limparTema } from './_lib/desenho.js'
import { chamarGemini } from './_lib/gemini.js'
import { erro, json, uidDoPedido } from './_lib/http.js'
import { calcularRestantes, LIMITES_DESENHOS } from './_lib/limites.js'
import { criarContador, periodoAtual } from './_lib/uso.js'

const contador = criarContador('usoDesenhos', LIMITES_DESENHOS)

export async function GET(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)
  const uso = await contador.consultar(uid, periodoAtual())
  return json(calcularRestantes(uso, LIMITES_DESENHOS))
}

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)

  const corpo: unknown = await request.json().catch(() => null)
  const tema = limparTema((corpo as { tema?: unknown } | null)?.tema)
  if (!tema) return erro('dados-invalidos', 400)

  const periodo = periodoAtual()
  const reserva = await contador.reservar(uid, periodo)
  if (!reserva.ok) return erro(reserva.motivo, 429, reserva.uso, LIMITES_DESENHOS)

  const resposta = await chamarGemini(corpoPedido(tema))
  // Resposta "ok" sem imagem: o modelo preferiu não desenhar (conta como recusa).
  const imagem = resposta.tipo === 'ok' ? extrairImagem(resposta.dados) : null
  if (!imagem) {
    // Recusas e falhas não contam no limite.
    const uso = await contador.devolver(uid, periodo)
    const recusado = resposta.tipo !== 'falha'
    return erro(recusado ? 'recusado' : 'falha', recusado ? 422 : 502, uso, LIMITES_DESENHOS)
  }

  return json({
    imagem: `data:${imagem.mimeType};base64,${imagem.data}`,
    ...calcularRestantes(reserva.uso, LIMITES_DESENHOS),
  })
}
