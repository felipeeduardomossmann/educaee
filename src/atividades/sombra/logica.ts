import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

/** Nível 1 = 2 sombras · 2 = 3 · 3 = 4 · 4 = 6. */
export const OPCOES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 6 }

export interface DesafioSombra {
  modelo: NomeFigura
  opcoes: NomeFigura[]
}

export function criarDesafio(
  figuras: readonly NomeFigura[],
  nivel: number,
  anterior: DesafioSombra | null,
  aleatorio?: Aleatorio,
): DesafioSombra {
  const [modelo] = sortear(
    figuras.filter((f) => f !== anterior?.modelo),
    1,
    aleatorio,
  ) as [NomeFigura]
  const outras = sortear(
    figuras.filter((f) => f !== modelo),
    (OPCOES_POR_NIVEL[nivel] ?? 2) - 1,
    aleatorio,
  )
  return { modelo, opcoes: embaralhar([modelo, ...outras], aleatorio) }
}

export const INSTRUCAO = 'Qual é a sombra desta figura?'

export function falas(): string[] {
  return [INSTRUCAO]
}
