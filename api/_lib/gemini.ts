// Chamada à Interactions API do Gemini (a chave fica só na variável de ambiente do servidor).

const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/interactions'
const TEMPO_MAXIMO_MS = 50_000

/** Todos os filtros de segurança no nível mais restritivo. */
export const FILTROS_SEGURANCA = [
  'harassment',
  'hate_speech',
  'sexually_explicit',
  'dangerous_content',
  'jailbreak',
].map((type) => ({ type, threshold: 'block_low_and_above' }))

/** Códigos de erro do Gemini que significam "o conteúdo foi barrado" (e não uma falha). */
const CODIGOS_RECUSA = new Set(['safety', 'jailbreak', 'prohibited_content', 'blocklist'])

export function ehRecusa(resposta: unknown): boolean {
  const codigo = (resposta as { error?: { code?: unknown } } | null)?.error?.code
  return typeof codigo === 'string' && CODIGOS_RECUSA.has(codigo)
}

export type RespostaGemini = { tipo: 'ok'; dados: unknown } | { tipo: 'recusado' | 'falha' }

export async function chamarGemini(corpo: unknown): Promise<RespostaGemini> {
  const chave = process.env.GEMINI_API_KEY
  if (!chave) {
    console.error('GEMINI_API_KEY não configurada')
    return { tipo: 'falha' }
  }
  let resposta: Response
  try {
    resposta = await fetch(URL_GEMINI, {
      method: 'POST',
      headers: { 'x-goog-api-key': chave, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
    })
  } catch (e) {
    console.error('Gemini: sem resposta', e)
    return { tipo: 'falha' }
  }
  const dados: unknown = await resposta.json().catch(() => null)
  if (resposta.ok) return { tipo: 'ok', dados }
  if (ehRecusa(dados)) return { tipo: 'recusado' }
  const codigo = (dados as { error?: { code?: unknown } } | null)?.error?.code
  console.error('Gemini: erro', resposta.status, codigo)
  return { tipo: 'falha' }
}
