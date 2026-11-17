import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { emArtigo, nomeFalado } from '../../lib/nomes-falados'
import { TEMAS } from '../../lib/temas'

// Pegue só o... (controle inibitório): tocar só na figura pedida e ignorar as outras.

/** Níveis 1 a 3: grade com figuras; quantas são a pedida. */
export const GRADE_POR_NIVEL: Record<number, { total: number; alvos: number }> = {
  1: { total: 4, alvos: 2 },
  2: { total: 6, alvos: 2 },
  3: { total: 8, alvos: 3 },
}
export const JOGADAS_GRADE = 6

/** Nível 4: uma figura por vez ("vai / não vai"). */
export const NIVEL_SEQUENCIA = 4
export const TEMPO_NA_TELA_MS = 2500
export const JOGADAS_SEQUENCIA = 8

export interface DesafioGrade {
  alvo: NomeFigura
  itens: NomeFigura[]
}

export function criarGrade(
  figuras: readonly NomeFigura[],
  nivel: number,
  anterior: DesafioGrade | null,
  aleatorio?: Aleatorio,
): DesafioGrade {
  const { total, alvos } = GRADE_POR_NIVEL[nivel] ?? GRADE_POR_NIVEL[1]
  const [alvo] = sortear(
    figuras.filter((f) => f !== anterior?.alvo),
    1,
    aleatorio,
  ) as [NomeFigura]
  const outras = figuras.filter((f) => f !== alvo)
  // As distrações podem se repetir (assim a grade não fica só com figuras diferentes).
  const distracoes = Array.from(
    { length: total - alvos },
    (_, i) => sortear(outras, 1, aleatorio)[0] ?? outras[i % outras.length],
  ) as NomeFigura[]
  return {
    alvo,
    itens: embaralhar([...Array<NomeFigura>(alvos).fill(alvo), ...distracoes], aleatorio),
  }
}

/** Nível 4: próxima figura (a pedida em ≥ 40% das vezes, no máximo 3 outras seguidas). */
export function proximaAparicao(
  alvo: NomeFigura,
  figuras: readonly NomeFigura[],
  outrasSeguidas: number,
  aleatorio: Aleatorio = Math.random,
): NomeFigura {
  if (outrasSeguidas >= 3 || aleatorio() < 0.4) return alvo
  return (sortear(
    figuras.filter((f) => f !== alvo),
    1,
    aleatorio,
  )[0] ?? alvo) as NomeFigura
}

export function instrucaoGrade(alvo: NomeFigura): string {
  return `Toque só ${emArtigo(alvo)}.`
}

export function instrucaoSequencia(alvo: NomeFigura): string {
  const { nome, genero } = nomeFalado(alvo)
  return `Toque só quando aparecer ${genero === 'm' ? 'o' : 'a'} ${nome}.`
}

export function falas(): string[] {
  const figuras = [...new Set(Object.values(TEMAS).flatMap((t) => t.figuras))]
  return figuras.flatMap((f) => [instrucaoGrade(f), instrucaoSequencia(f)])
}
