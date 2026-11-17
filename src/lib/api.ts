import type { User } from 'firebase/auth'

// Chamadas às funções com IA (/api/desenho e /api/analise). O login vai no ID token do
// Firebase; a IA e as chaves ficam só no servidor.

export interface Restantes {
  restamHoje: number
  limitadoPeloMes: boolean
}

export type CodigoErroApi =
  | 'sem-login'
  | 'dados-invalidos'
  | 'limite-dia'
  | 'limite-mes'
  | 'cota-youtube'
  | 'recusado'
  | 'falha'

const CODIGOS = new Set<string>([
  'sem-login',
  'dados-invalidos',
  'limite-dia',
  'limite-mes',
  'cota-youtube',
  'recusado',
  'falha',
])

export function lerRestantes(dados: unknown): Restantes | undefined {
  const d = dados as Partial<Restantes> | null
  if (typeof d?.restamHoje !== 'number') return undefined
  return { restamHoje: d.restamHoje, limitadoPeloMes: d.limitadoPeloMes === true }
}

export function lerCodigoErro(dados: unknown): CodigoErroApi {
  const codigo = (dados as { codigo?: unknown } | null)?.codigo
  return typeof codigo === 'string' && CODIGOS.has(codigo) ? (codigo as CodigoErroApi) : 'falha'
}

export async function chamarApi(usuario: User, caminho: string, corpo?: unknown) {
  const token = await usuario.getIdToken()
  const resposta = await fetch(caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const dados: unknown = await resposta.json().catch(() => null)
  return { resposta, dados }
}

/** Quantos usos restam hoje; null se não deu para saber (ex.: sem internet). */
export async function consultarRestantesApi(
  usuario: User,
  caminho: string,
): Promise<Restantes | null> {
  try {
    const { resposta, dados } = await chamarApi(usuario, caminho)
    return resposta.ok ? (lerRestantes(dados) ?? null) : null
  } catch {
    return null
  }
}
