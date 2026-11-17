// /api/pictograma: POST { palavra } = 2 opções de imagem e a fala do cartão.
// Conta no mesmo limite dos desenhos.

import { extrairImagem } from './_lib/desenho.js'
import { chamarGemini } from './_lib/gemini.js'
import { erro, json, uidDoPedido } from './_lib/http.js'
import { calcularRestantes, LIMITES_DESENHOS } from './_lib/limites.js'
import {
  corpoPedidoPictograma,
  falaDoCartao,
  limparPalavra,
  OPCOES_PICTOGRAMA,
} from './_lib/pictograma.js'
import { gravarFala } from './_lib/tts.js'
import { criarContador, periodoAtual } from './_lib/uso.js'

const contador = criarContador('usoDesenhos', LIMITES_DESENHOS)

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)

  const corpo: unknown = await request.json().catch(() => null)
  const palavra = limparPalavra((corpo as { palavra?: unknown } | null)?.palavra)
  if (!palavra) return erro('dados-invalidos', 400)

  // Reserva uma imagem por opção (se só couber uma, gera uma).
  const periodo = periodoAtual()
  let reservadas = 0
  let ultimaReserva = await contador.reservar(uid, periodo)
  while (ultimaReserva.ok && ++reservadas < OPCOES_PICTOGRAMA) {
    ultimaReserva = await contador.reservar(uid, periodo)
  }
  if (reservadas === 0 && !ultimaReserva.ok) {
    return erro(ultimaReserva.motivo, 429, ultimaReserva.uso, LIMITES_DESENHOS)
  }

  const [audio, ...respostas] = await Promise.all([
    gravarFala(falaDoCartao(palavra)).catch(() => null),
    ...Array.from({ length: reservadas }, () => chamarGemini(corpoPedidoPictograma(palavra))),
  ])
  const imagens = respostas
    .map((r) => (r.tipo === 'ok' ? extrairImagem(r.dados) : null))
    .filter((img) => img !== null)
    .map((img) => `data:${img.mimeType};base64,${img.data}`)

  // Imagens que não vieram não contam no limite.
  let uso = ultimaReserva.uso
  for (let i = imagens.length; i < reservadas; i++) uso = await contador.devolver(uid, periodo)
  if (imagens.length === 0) {
    const recusado = respostas.some((r) => r.tipo !== 'falha')
    return erro(recusado ? 'recusado' : 'falha', recusado ? 422 : 502, uso, LIMITES_DESENHOS)
  }
  return json({ imagens, audio, ...calcularRestantes(uso, LIMITES_DESENHOS) })
}
