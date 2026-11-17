// /api/analise: GET = análises restantes; POST = análise do progresso (só números, sem nome).

import {
  corpoPedidoAnalise,
  extrairTexto,
  lerAnalise,
  removerContradicoes,
  validarDados,
} from './_lib/analise.js'
import { chamarGemini } from './_lib/gemini.js'
import { erro, json, uidDoPedido } from './_lib/http.js'
import { calcularRestantes, LIMITES_ANALISES } from './_lib/limites.js'
import { criarContador, periodoAtual } from './_lib/uso.js'

const contador = criarContador('usoAnalises', LIMITES_ANALISES)

export async function GET(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)
  const uso = await contador.consultar(uid, periodoAtual())
  return json(calcularRestantes(uso, LIMITES_ANALISES))
}

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return erro('sem-login', 401)

  const dados = validarDados(await request.json().catch(() => null))
  if (!dados || dados.atividades.every((a) => a.totalRodadas === 0)) {
    return erro('dados-invalidos', 400)
  }

  const periodo = periodoAtual()
  const reserva = await contador.reservar(uid, periodo)
  if (!reserva.ok) return erro(reserva.motivo, 429, reserva.uso, LIMITES_ANALISES)

  const resposta = await chamarGemini(corpoPedidoAnalise(dados))
  const lida = resposta.tipo === 'ok' ? lerAnalise(extrairTexto(resposta.dados)) : null
  const analise = lida && removerContradicoes(lida, dados)
  if (!analise) {
    // Recusas e falhas (inclusive resposta fora do formato) não contam no limite.
    const uso = await contador.devolver(uid, periodo)
    const recusado = resposta.tipo === 'recusado'
    return erro(recusado ? 'recusado' : 'falha', recusado ? 422 : 502, uso, LIMITES_ANALISES)
  }

  return json({ analise, ...calcularRestantes(reserva.uso, LIMITES_ANALISES) })
}
