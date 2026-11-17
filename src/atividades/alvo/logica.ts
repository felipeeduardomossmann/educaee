import { sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

/** Tamanho do alvo por nível: fração do menor lado e máximo em px. */
const TAMANHO_POR_NIVEL: Record<number, { fator: number; maximo: number }> = {
  1: { fator: 0.6, maximo: 320 },
  2: { fator: 0.4, maximo: 220 },
  3: { fator: 0.25, maximo: 150 },
  4: { fator: 0.25, maximo: 150 },
}

/** Toque fora do alvo conta como erro só a partir deste nível. */
export const NIVEL_ERRO_FORA = 3
/** A partir deste nível o alvo se move (parado com animações reduzidas). */
export const NIVEL_MOVIMENTO = 4

/** Nível em que o alvo aparece pequeno e cresce devagar até o tamanho normal. */
export const NIVEL_CRESCE = 1
export const ESCALA_INICIAL = 0.4
export const DURACAO_CRESCER_MS = 2200
/** Velocidade do alvo em movimento: devagar. */
export const VELOCIDADE_PX_S = 60

export function ladoDoAlvo(nivel: number, menorLado: number, areaToque: number): number {
  const { fator, maximo } = TAMANHO_POR_NIVEL[nivel] ?? { fator: 0.6, maximo: 320 }
  return Math.round(Math.max(areaToque, Math.min(maximo, menorLado * fator)))
}

/** Posição como fração (0 a 1) do espaço livre: 0 = encostado à esquerda/topo, 1 = à direita/base. */
export interface Posicao {
  x: number
  y: number
}

export const CENTRO: Posicao = { x: 0.5, y: 0.5 }

/** Posição aleatória, longe o bastante da anterior para o alvo "pular" de lugar. */
export function posicaoAleatoria(anterior: Posicao | null, aleatorio: Aleatorio = Math.random) {
  let melhor: Posicao = { x: aleatorio(), y: aleatorio() }
  for (let tentativa = 0; anterior && tentativa < 20; tentativa++) {
    if (Math.hypot(melhor.x - anterior.x, melhor.y - anterior.y) >= 0.35) break
    melhor = { x: aleatorio(), y: aleatorio() }
  }
  return melhor
}

export interface Movimento {
  posicao: Posicao
  /** Velocidade em px/s (x, y). */
  vx: number
  vy: number
}

export function direcaoAleatoria(aleatorio: Aleatorio = Math.random): { vx: number; vy: number } {
  const angulo = aleatorio() * Math.PI * 2
  return { vx: Math.cos(angulo) * VELOCIDADE_PX_S, vy: Math.sin(angulo) * VELOCIDADE_PX_S }
}

/** Avança o movimento `dt` segundos, quicando nas bordas. */
export function mover(movimento: Movimento, dt: number, livreX: number, livreY: number): Movimento {
  let { vx, vy } = movimento
  let x = movimento.posicao.x + (livreX > 0 ? (vx * dt) / livreX : 0)
  let y = movimento.posicao.y + (livreY > 0 ? (vy * dt) / livreY : 0)
  if (x < 0 || x > 1) {
    x = Math.min(1, Math.max(0, x))
    vx = -vx
  }
  if (y < 0 || y > 1) {
    y = Math.min(1, Math.max(0, y))
    vy = -vy
  }
  return { posicao: { x, y }, vx, vy }
}

/** Próxima figura: do tema, diferente da anterior. */
export function proximaFigura(
  figuras: readonly NomeFigura[],
  anterior: NomeFigura | null,
  aleatorio?: Aleatorio,
): NomeFigura {
  const [figura] = sortear(
    figuras.filter((f) => f !== anterior),
    1,
    aleatorio,
  ) as [NomeFigura]
  return figura
}

/** Instrução falada (e mostrada) a cada rodada. */
export const INSTRUCAO = 'Toque na figura.'

/** Todas as falas desta atividade (para o catálogo de áudios gravados). */
export function falas(): string[] {
  return [INSTRUCAO]
}
