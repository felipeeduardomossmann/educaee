// Indicadores do progresso calculados no servidor; a IA recebe estes, não as rodadas.

export const AREAS = [
  'Memória',
  'Atenção',
  'Coordenação motora',
  'Alfabetização',
  'Lógica',
  'Emoções',
  'Matemática',
] as const
export type Area = (typeof AREAS)[number]

export interface RodadaIndicador {
  /** "AAAA-MM-DD" */
  data: string
  nivel: number
  /** Taxa de acerto em % (0 a 100). */
  taxa: number
}

export type Tendencia = 'subindo' | 'caindo' | 'estavel' | 'poucos-dados'
export type Consistencia = 'regular' | 'variavel' | 'muito-variavel' | 'poucos-dados'
/** "pode-subir": 3 rodadas no nível final com média ≥ 90%; "desafiador": média < 50%. */
export type SinalNivel = 'pode-subir' | 'desafiador' | 'adequado' | 'poucos-dados'

export interface IndicadoresAtividade {
  rodadas: number
  nivelAtual: number
  nivelInicio: number
  nivelFim: number
  subidas: number
  descidas: number
  mediaTaxa: number
  /** Média das primeiras e das últimas rodadas (mesmo tamanho, até 3 cada). */
  taxaInicio: number | null
  taxaFim: number | null
  tendencia: Tendencia
  consistencia: Consistencia
  /** Média e número de rodadas no nível em que o aluno terminou o período. */
  mediaNoNivelFinal: number
  rodadasNoNivelFinal: number
  sinal: SinalNivel
  dias: number
  primeiraData: string
  ultimaData: string
}

/** Diferença (em pontos de %) entre o fim e o início que já conta como mudança. */
export const LIMIAR_TENDENCIA = 10
/** Mínimo de rodadas para falar de tendência e de consistência. */
export const MINIMO_TENDENCIA = 4
export const MINIMO_CONSISTENCIA = 3

const media = (valores: readonly number[]) =>
  valores.length === 0 ? 0 : valores.reduce((s, v) => s + v, 0) / valores.length

function desvioPadrao(valores: readonly number[]): number {
  const m = media(valores)
  return Math.sqrt(media(valores.map((v) => (v - m) ** 2)))
}

/** Indicadores de uma atividade (rodadas em ordem cronológica; o total pode ser maior). */
export function indicadoresAtividade(
  rodadas: readonly RodadaIndicador[],
  nivelAtual: number,
  totalRodadas = rodadas.length,
): IndicadoresAtividade | null {
  if (rodadas.length === 0) return null
  const taxas = rodadas.map((r) => r.taxa)
  let subidas = 0
  let descidas = 0
  for (let i = 1; i < rodadas.length; i++) {
    if (rodadas[i].nivel > rodadas[i - 1].nivel) subidas++
    if (rodadas[i].nivel < rodadas[i - 1].nivel) descidas++
  }

  let taxaInicio: number | null = null
  let taxaFim: number | null = null
  let tendencia: Tendencia = 'poucos-dados'
  if (rodadas.length >= MINIMO_TENDENCIA) {
    const tamanho = Math.min(3, Math.floor(rodadas.length / 2))
    taxaInicio = Math.round(media(taxas.slice(0, tamanho)))
    taxaFim = Math.round(media(taxas.slice(-tamanho)))
    const diferenca = taxaFim - taxaInicio
    tendencia =
      diferenca >= LIMIAR_TENDENCIA
        ? 'subindo'
        : diferenca <= -LIMIAR_TENDENCIA
          ? 'caindo'
          : 'estavel'
  }

  let consistencia: Consistencia = 'poucos-dados'
  if (rodadas.length >= MINIMO_CONSISTENCIA) {
    const dp = desvioPadrao(taxas)
    consistencia = dp < 12 ? 'regular' : dp <= 25 ? 'variavel' : 'muito-variavel'
  }

  const nivelFim = rodadas[rodadas.length - 1].nivel
  const noNivelFinal: number[] = []
  for (let i = rodadas.length - 1; i >= 0 && rodadas[i].nivel === nivelFim; i--) {
    noNivelFinal.push(rodadas[i].taxa)
  }

  let sinal: SinalNivel = 'poucos-dados'
  if (noNivelFinal.length >= 3) {
    const ultimas = media(noNivelFinal.slice(0, 3))
    const mediaFinal = media(noNivelFinal)
    sinal =
      ultimas >= 90 && nivelFim < 4 ? 'pode-subir' : mediaFinal < 50 ? 'desafiador' : 'adequado'
  }

  return {
    rodadas: totalRodadas,
    nivelAtual,
    nivelInicio: rodadas[0].nivel,
    nivelFim,
    subidas,
    descidas,
    mediaTaxa: Math.round(media(taxas)),
    taxaInicio,
    taxaFim,
    tendencia,
    consistencia,
    mediaNoNivelFinal: Math.round(media(noNivelFinal)),
    rodadasNoNivelFinal: noNivelFinal.length,
    sinal,
    dias: new Set(rodadas.map((r) => r.data)).size,
    primeiraData: rodadas[0].data,
    ultimaData: rodadas[rodadas.length - 1].data,
  }
}

/** Dias corridos entre duas datas "AAAA-MM-DD" (inclusive). */
export function diasEntre(inicio: string, fim: string): number {
  const ms = Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)
  return Math.round(ms / 86_400_000) + 1
}

/** Rodadas por semana. O período fixo (7 ou 30 dias) vale mais que o intervalo das datas. */
export function rodadasPorSemana(totalRodadas: number, diasDoPeriodo: number): number {
  return Math.round((totalRodadas / Math.max(diasDoPeriodo, 7)) * 7 * 10) / 10
}

/** Mínimo de rodadas para uma área ser ponto forte ou de atenção. */
export const POUCA_PRATICA = MINIMO_TENDENCIA
