import { type Aleatorio } from '../../lib/aleatorio'

/** Quanto tempo segurar em cada nível. */
export const TEMPO_POR_NIVEL_MS: Record<number, number> = { 1: 1000, 2: 1500, 3: 2000, 4: 2000 }
/** Tamanho do alvo (fração do menor lado da área); o 4 é menor e muda de lugar. */
export const TAMANHO_POR_NIVEL: Record<number, number> = { 1: 0.6, 2: 0.55, 3: 0.5, 4: 0.36 }
export const NIVEL_MUDA_LUGAR = 4

export const INSTRUCAO = 'Toque e segure até o círculo encher.'

export function falas(): string[] {
  return [INSTRUCAO]
}

/** Progresso (0 a 1) depois de segurar por `ms`. */
export function progresso(ms: number, nivel: number): number {
  const total = TEMPO_POR_NIVEL_MS[nivel] ?? 1000
  return Math.max(0, Math.min(1, ms / total))
}

/** Posição (0 a 1 em x e y) do alvo; no centro até o nível 3. */
export function posicaoDoAlvo(nivel: number, aleatorio: Aleatorio = Math.random) {
  if (nivel < NIVEL_MUDA_LUGAR) return { x: 0.5, y: 0.5 }
  return { x: 0.15 + aleatorio() * 0.7, y: 0.15 + aleatorio() * 0.7 }
}
