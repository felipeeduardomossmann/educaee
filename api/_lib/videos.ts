// Lógica pura dos "Vídeos" (sem rede nem banco), testada em videos.test.ts.

import { FILTROS_SEGURANCA } from './gemini.js'
import { MODELO_ANALISE } from './analise.js'

export const TAMANHO_MAXIMO_TERMO = 60
export const MAXIMO_VIDEOS = 12
export const DURACAO_MAXIMA_SEG = 20 * 60
/** Resultados pedidos ao search.list (o custo de cota é o mesmo de 1 a 50). */
export const RESULTADOS_BUSCA = 50
/** Cache de cada termo (as políticas do YouTube permitem até 30 dias). */
export const VALIDADE_CACHE_MS = 24 * 60 * 60 * 1000
/** Cota própria do search.list: 100 por dia no projeto; paramos antes. */
export const LIMITE_BUSCAS_YOUTUBE_DIA = 95

/** Limpa o termo digitado (como o tema dos desenhos). null se vazio ou longo demais. */
export function limparTermo(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  const termo = bruto
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/["“”«»`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (termo.length === 0 || termo.length > TAMANHO_MAXIMO_TERMO) return null
  return termo
}

/** Chave do cache: minúsculas, sem acentos e sem pontuação ("Dinossauros!" = "dinossauros"). */
export function normalizarTermo(termo: string): string {
  return termo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** O que vai para o YouTube: o termo + "para crianças" (o que deu melhores resultados). */
export function termoDeBusca(termo: string): string {
  return /crian[cç]a|infantil/i.test(termo) ? termo : `${termo} para crianças`
}

/** Dia no horário do Pacífico (quando a cota do YouTube vira), como "2026-11-02". */
export function diaPacifico(data: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data)
}

/** "PT1H2M3S" → 3723. Formatos estranhos (ou ao vivo, "P0D") viram 0. */
export function duracaoEmSegundos(iso: unknown): number {
  if (typeof iso !== 'string') return 0
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso)
  if (!m) return 0
  const [, d = '0', h = '0', min = '0', s = '0'] = m
  return Number(d) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s)
}

const ENTIDADES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
}

/** O search.list devolve títulos com entidades HTML (&quot;, &#39;...). */
export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&(amp|quot|#39|apos|lt|gt);/g, (e) => ENTIDADES[e] ?? e)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
}

export interface Video {
  id: string
  titulo: string
  canal: string
  duracaoSeg: number
  miniatura: string
}

/** Item do videos.list já conferido, com a descrição curta (só para o filtro da IA). */
export interface Candidato extends Video {
  descricao: string
}

const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/

/** Mantém só vídeos para crianças, incorporáveis, públicos e de até 20 min. */
export function filtrarDetalhes(itens: unknown, ordem: readonly string[]): Candidato[] {
  if (!Array.isArray(itens)) return []
  const aprovados = new Map<string, Candidato>()
  for (const item of itens as Record<string, Record<string, unknown> | string>[]) {
    const id = item?.id
    const status = item?.status as Record<string, unknown> | undefined
    const snippet = item?.snippet as Record<string, unknown> | undefined
    const detalhes = item?.contentDetails as Record<string, unknown> | undefined
    if (typeof id !== 'string' || !ID_VALIDO.test(id) || !status || !snippet) continue
    if (status.madeForKids !== true || status.embeddable !== true) continue
    if (status.privacyStatus !== 'public') continue
    const duracaoSeg = duracaoEmSegundos(detalhes?.duration)
    if (duracaoSeg <= 0 || duracaoSeg > DURACAO_MAXIMA_SEG) continue
    const miniaturas = snippet.thumbnails as Record<string, { url?: unknown }> | undefined
    const miniatura = [miniaturas?.high, miniaturas?.medium, miniaturas?.default]
      .map((m) => m?.url)
      .find((url): url is string => typeof url === 'string' && url.startsWith('https://'))
    if (!miniatura) continue
    aprovados.set(id, {
      id,
      titulo: decodificarEntidades(String(snippet.title ?? '')).slice(0, 200),
      canal: decodificarEntidades(String(snippet.channelTitle ?? '')).slice(0, 100),
      duracaoSeg,
      miniatura,
      descricao: String(snippet.description ?? '')
        .replace(/\s+/g, ' ')
        .slice(0, 200),
    })
  }
  return ordem.map((id) => aprovados.get(id)).filter((v): v is Candidato => v !== undefined)
}

export function paraVideo({ id, titulo, canal, duracaoSeg, miniatura }: Candidato): Video {
  return { id, titulo, canal, duracaoSeg, miniatura }
}

export function promptFiltro(termo: string, candidatos: readonly Candidato[]): string {
  const lista = candidatos
    .map(
      (c) => `- id: ${c.id} | título: ${c.titulo} | canal: ${c.canal} | descrição: ${c.descricao}`,
    )
    .join('\n')
  return `Você ajuda professoras do Atendimento Educacional Especializado (AEE) a escolher vídeos do YouTube para crianças (de 4 a 12 anos, algumas com deficiência).

A professora buscou: "${termo}".

Aprove só os vídeos que são apropriados para crianças E que tratam do tema buscado. Recuse:
- violência, sustos, terror, lutas ou brigas assustadoras, armas;
- conteúdo adulto, linguagem imprópria, desafios perigosos, pegadinhas;
- vídeos que são principalmente propaganda de brinquedos ou produtos (unboxing, "abrindo surpresas");
- títulos sensacionalistas ou caça-cliques;
- vídeos que fogem do tema buscado.
Na dúvida, recuse.

Responda em JSON com "aprovados": a lista de ids aprovados, na mesma ordem.

Vídeos:
${lista}`
}

export function corpoPedidoFiltro(termo: string, candidatos: readonly Candidato[]) {
  return {
    model: MODELO_ANALISE,
    store: false,
    input: [{ type: 'text', text: promptFiltro(termo, candidatos) }],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: {
        type: 'object',
        properties: { aprovados: { type: 'array', items: { type: 'string' } } },
        required: ['aprovados'],
      },
    },
    generation_config: { thinking_level: 'minimal', temperature: 0 },
    safety_settings: FILTROS_SEGURANCA,
  }
}

/** Ids aprovados pela IA (só os que estavam na lista). null se a resposta não servir. */
export function lerAprovados(texto: string | null, candidatos: readonly Candidato[]) {
  if (!texto) return null
  let json: unknown
  try {
    json = JSON.parse(texto)
  } catch {
    return null
  }
  const lista = (json as { aprovados?: unknown } | null)?.aprovados
  if (!Array.isArray(lista)) return null
  const ids = new Set(lista.filter((v): v is string => typeof v === 'string'))
  return candidatos.filter((c) => ids.has(c.id))
}
