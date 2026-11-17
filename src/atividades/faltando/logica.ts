import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

/** Figuras na fileira e opções de resposta em cada nível. */
export const CONFIG_POR_NIVEL: Record<number, { figuras: number; opcoes: number }> = {
  1: { figuras: 3, opcoes: 2 },
  2: { figuras: 3, opcoes: 3 },
  3: { figuras: 4, opcoes: 4 },
  4: { figuras: 5, opcoes: 4 },
}
/** Tempo para olhar a fileira antes de uma figura sumir. */
export const OLHAR_MS = 3500

export interface DesafioFaltando {
  fileira: NomeFigura[]
  /** Posição da figura que some. */
  sumiu: number
  /** A que sumiu + figuras que não estavam na fileira. */
  opcoes: NomeFigura[]
}

export function criarDesafio(
  figuras: readonly NomeFigura[],
  nivel: number,
  anterior: DesafioFaltando | null,
  aleatorio: Aleatorio = Math.random,
): DesafioFaltando {
  const { figuras: n, opcoes: m } = CONFIG_POR_NIVEL[nivel] ?? CONFIG_POR_NIVEL[1]
  const fileira = sortear(figuras, n, aleatorio)
  let sumiu = Math.floor(aleatorio() * n)
  if (anterior && fileira[sumiu] === anterior.fileira[anterior.sumiu]) sumiu = (sumiu + 1) % n
  const fora = sortear(
    figuras.filter((f) => !fileira.includes(f)),
    m - 1,
    aleatorio,
  )
  return { fileira, sumiu, opcoes: embaralhar([fileira[sumiu] as NomeFigura, ...fora], aleatorio) }
}

export const FALA_OLHAR = 'Olhe bem as figuras.'
export const FALA_PERGUNTA = 'Qual figura sumiu?'

export function falas(): string[] {
  return [FALA_OLHAR, FALA_PERGUNTA]
}
