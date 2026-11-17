import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import {
  figurasDosTemas,
  falaDaCarta,
  FALA_ESPIAR,
  type Carta,
  type EstadoMemoria,
} from '../memoria/logica'

/** Pares que combinam (associação). */
export const PARES_ASSOCIADOS: readonly [NomeFigura, NomeFigura][] = [
  ['cachorro', 'osso'],
  ['macaco', 'banana'],
  ['coelho', 'cenoura'],
  ['abelha', 'flor'],
  ['astronauta', 'foguete'],
  ['vaca', 'leite'],
  ['peixe', 'anzol'],
  ['mao', 'anel'],
]

/** Nível 1 = 2 pares · 2 = 4 · 3 = 6 (associados) · 4 = 6 pares figura–sombra. */
export const PARES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 4, 3: 6, 4: 6 }

export const INSTRUCAO_PARES = 'Encontre as figuras que combinam. Toque em duas cartas.'
export const INSTRUCAO_SOMBRAS = 'Encontre cada figura e a sua sombra. Toque em duas cartas.'

export function instrucaoDoNivel(nivel: number): string {
  return nivel >= 4 ? INSTRUCAO_SOMBRAS : INSTRUCAO_PARES
}

export function criarJogoPares(
  nivel: number,
  figurasDoTema: readonly NomeFigura[],
  aleatorio?: Aleatorio,
): EstadoMemoria {
  const quantidade = PARES_POR_NIVEL[nivel] ?? 2
  let cartas: Carta[]
  if (nivel >= 4) {
    cartas = sortear(figurasDoTema, quantidade, aleatorio).flatMap((figura) => [
      { figura, par: figura, encontrada: false },
      { figura, par: figura, sombra: true, encontrada: false },
    ])
  } else {
    cartas = sortear(PARES_ASSOCIADOS, quantidade, aleatorio).flatMap(([a, b]) => [
      { figura: a, par: a, encontrada: false },
      { figura: b, par: a, encontrada: false },
    ])
  }
  return { cartas: embaralhar(cartas, aleatorio), viradas: [], aguardandoDesvirar: false }
}

export function falas(): string[] {
  return [
    INSTRUCAO_PARES,
    INSTRUCAO_SOMBRAS,
    FALA_ESPIAR,
    ...PARES_ASSOCIADOS.flat().map((figura) => falaDaCarta({ figura })),
    ...figurasDosTemas().map((figura) => falaDaCarta({ figura, sombra: true })),
  ]
}
