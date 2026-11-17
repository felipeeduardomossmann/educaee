import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import { distanciaCor, type Rgb } from '../../lib/cor-figura'
import type { NomeFigura } from '../../lib/figuras'

/** Nível 1 = 2 opções · 2 = 4 · 3 = 6 · 4 = 6 com figuras de cores parecidas. */
export const OPCOES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 4, 3: 6, 4: 6 }

export interface DesafioIgual {
  modelo: NomeFigura
  opcoes: NomeFigura[]
}

/** As figuras de cor mais próxima do modelo, da mais parecida para a menos. */
export function maisParecidas(
  modelo: NomeFigura,
  candidatas: readonly NomeFigura[],
  cores: Partial<Record<NomeFigura, Rgb>>,
): NomeFigura[] {
  const corModelo = cores[modelo]
  if (!corModelo) return [...candidatas]
  const distancia = (figura: NomeFigura) => {
    const cor = cores[figura]
    return cor ? distanciaCor(corModelo, cor) : Number.POSITIVE_INFINITY
  }
  return [...candidatas].sort((a, b) => distancia(a) - distancia(b))
}

export function criarDesafio(
  figurasDoTema: readonly NomeFigura[],
  nivel: number,
  anterior: NomeFigura | null,
  cores: Partial<Record<NomeFigura, Rgb>> = {},
  aleatorio?: Aleatorio,
): DesafioIgual {
  // Não repete o modelo da jogada anterior.
  const possiveis = figurasDoTema.filter((figura) => figura !== anterior)
  const [modelo] = sortear(possiveis, 1, aleatorio) as [NomeFigura]
  const outras = figurasDoTema.filter((figura) => figura !== modelo)
  const quantidade = (OPCOES_POR_NIVEL[nivel] ?? 2) - 1

  // Nível 4: as distrações são as figuras do tema de cor mais próxima do modelo.
  const distracoes =
    nivel >= 4
      ? maisParecidas(modelo, outras, cores).slice(0, quantidade)
      : sortear(outras, quantidade, aleatorio)

  return { modelo, opcoes: embaralhar([modelo, ...distracoes], aleatorio) }
}

/** Instrução falada (e mostrada) a cada rodada. */
export const INSTRUCAO = 'Toque na figura igual a esta.'

/** Todas as falas desta atividade (para o catálogo de áudios gravados). */
export function falas(): string[] {
  return [INSTRUCAO]
}
