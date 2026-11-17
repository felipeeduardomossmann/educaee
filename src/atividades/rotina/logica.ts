import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

// Rotina do dia: tocar as cenas na ordem em que acontecem.

export interface Cena {
  figura: NomeFigura
  /** Para leitores de tela. */
  rotulo: string
}

const c = (figura: NomeFigura, rotulo: string): Cena => ({ figura, rotulo })

const DE_TRES: Cena[][] = [
  [
    c('despertador', 'acordar'),
    c('escova-de-dentes', 'escovar os dentes'),
    c('prato', 'tomar café'),
  ],
  [c('prato', 'jantar'), c('banheira', 'tomar banho'), c('cama', 'dormir')],
  [c('ovo', 'ovo'), c('pintinho', 'pintinho'), c('galinha', 'galinha')],
  [c('broto', 'broto'), c('planta', 'planta crescendo'), c('girassol', 'flor')],
  [c('nuvem', 'nuvem'), c('chuva', 'chuva'), c('arco-iris', 'arco-íris')],
  [c('sabonete', 'lavar as mãos'), c('prato', 'comer'), c('escova-de-dentes', 'escovar os dentes')],
]

const DE_QUATRO: Cena[][] = [
  [
    c('despertador', 'acordar'),
    c('escova-de-dentes', 'escovar os dentes'),
    c('prato', 'tomar café'),
    c('livros', 'estudar'),
  ],
  [
    c('prato', 'jantar'),
    c('banheira', 'tomar banho'),
    c('livros', 'ouvir uma história'),
    c('cama', 'dormir'),
  ],
  [c('nuvem', 'nuvem'), c('chuva', 'chuva'), c('arco-iris', 'arco-íris'), c('sol', 'sol')],
  [
    c('broto', 'broto'),
    c('planta', 'planta crescendo'),
    c('flor', 'flor'),
    c('abelha', 'abelha na flor'),
  ],
  [c('ovo', 'ovo'), c('pintinho', 'pintinho'), c('galinha', 'galinha'), c('ovo', 'ovo novo')],
]

export const SEQUENCIAS_POR_NIVEL: Record<number, Cena[][]> = {
  1: DE_TRES,
  2: DE_TRES,
  3: DE_QUATRO,
  4: DE_QUATRO,
}
/** Nos níveis 1 e 3, a primeira cena já vem no lugar (é uma ajuda). */
const PRIMEIRA_PRONTA = [1, 3]
export const JOGADAS_ROTINA = 6

export interface DesafioRotina {
  cenas: Cena[]
  /** Quantas já começam no lugar. */
  prontas: number
  /** Índices das cenas, embaralhados (as peças para tocar). */
  pecas: number[]
}

export function criarDesafio(
  nivel: number,
  anterior: DesafioRotina | null,
  aleatorio?: Aleatorio,
): DesafioRotina {
  const lista = SEQUENCIAS_POR_NIVEL[nivel] ?? DE_TRES
  const [cenas] = sortear(
    lista.filter((s) => s !== anterior?.cenas),
    1,
    aleatorio,
  ) as [Cena[]]
  const prontas = PRIMEIRA_PRONTA.includes(nivel) ? 1 : 0
  const restantes = cenas.map((_, i) => i).slice(prontas)
  return { cenas, prontas, pecas: embaralhar(restantes, aleatorio) }
}

export const INSTRUCAO = 'O que acontece primeiro? Toque na ordem.'

export function falas(): string[] {
  return [INSTRUCAO]
}
