// Respostas JSON e login das funções da API.

import { idProjeto } from './firebase-admin.js'
import { calcularRestantes, type Limites, type Uso } from './limites.js'
import { verificarIdToken } from './token.js'

/** Códigos que o navegador entende (as mensagens ficam na tela, em português). */
export type CodigoErro =
  | 'sem-login'
  | 'dados-invalidos'
  | 'limite-dia'
  | 'limite-mes'
  | 'cota-youtube'
  | 'recusado'
  | 'falha'

export function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export function erro(codigo: CodigoErro, status: number, uso?: Uso, limites?: Limites): Response {
  return json({ codigo, ...(uso && limites ? calcularRestantes(uso, limites) : {}) }, status)
}

/** uid de quem fez o pedido (Authorization: Bearer <ID token do Firebase>), ou null. */
export async function uidDoPedido(request: Request): Promise<string | null> {
  const cabecalho = request.headers.get('authorization') ?? ''
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : ''
  if (!token) return null
  return verificarIdToken(token, idProjeto())
}
