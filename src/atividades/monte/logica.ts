import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { falaDaCarta } from '../memoria/logica'

// Monte a palavra: tocar as sílabas na ordem, com a figura de apoio.

export interface PalavraSilabas {
  figura: NomeFigura
  silabas: string[]
}

const DUAS: PalavraSilabas[] = [
  { figura: 'bola', silabas: ['BO', 'LA'] },
  { figura: 'gato', silabas: ['GA', 'TO'] },
  { figura: 'pato', silabas: ['PA', 'TO'] },
  { figura: 'sapo', silabas: ['SA', 'PO'] },
  { figura: 'casa', silabas: ['CA', 'SA'] },
  { figura: 'dado', silabas: ['DA', 'DO'] },
  { figura: 'mala', silabas: ['MA', 'LA'] },
  { figura: 'vaca', silabas: ['VA', 'CA'] },
  { figura: 'foca', silabas: ['FO', 'CA'] },
  { figura: 'lua', silabas: ['LU', 'A'] },
  { figura: 'vela', silabas: ['VE', 'LA'] },
  { figura: 'rato', silabas: ['RA', 'TO'] },
]

const TRES: PalavraSilabas[] = [
  { figura: 'banana', silabas: ['BA', 'NA', 'NA'] },
  { figura: 'macaco', silabas: ['MA', 'CA', 'CO'] },
  { figura: 'pipoca', silabas: ['PI', 'PO', 'CA'] },
  { figura: 'janela', silabas: ['JA', 'NE', 'LA'] },
  { figura: 'cenoura', silabas: ['CE', 'NOU', 'RA'] },
  { figura: 'cereja', silabas: ['CE', 'RE', 'JA'] },
  { figura: 'laranja', silabas: ['LA', 'RAN', 'JA'] },
  { figura: 'abelha', silabas: ['A', 'BE', 'LHA'] },
]

export const PALAVRAS_POR_NIVEL: Record<number, PalavraSilabas[]> = {
  1: DUAS,
  2: DUAS,
  3: TRES,
  4: TRES,
}
const COM_SOBRA = [2, 4]
export const JOGADAS_MONTE = 6

/** Sílabas sobrando, para os níveis 2 e 4. */
const SOBRAS = ['PE', 'MI', 'TU', 'RO', 'FA', 'DE', 'BU', 'NI']

export interface Peca {
  id: number
  silaba: string
}

export interface DesafioMonte {
  palavra: PalavraSilabas
  pecas: Peca[]
}

export function criarDesafio(
  nivel: number,
  anterior: DesafioMonte | null,
  aleatorio?: Aleatorio,
): DesafioMonte {
  const lista = PALAVRAS_POR_NIVEL[nivel] ?? DUAS
  const [palavra] = sortear(
    lista.filter((p) => p.figura !== anterior?.palavra.figura),
    1,
    aleatorio,
  ) as [PalavraSilabas]
  const silabas = [...palavra.silabas]
  if (COM_SOBRA.includes(nivel)) {
    silabas.push(
      sortear(
        SOBRAS.filter((s) => !palavra.silabas.includes(s)),
        1,
        aleatorio,
      )[0] as string,
    )
  }
  return {
    palavra,
    pecas: embaralhar(
      silabas.map((silaba, id) => ({ id, silaba })),
      aleatorio,
    ),
  }
}

/** A peça tocada é a próxima sílaba da palavra? (sílabas repetidas, como em BANANA, valem.) */
export function ehAProxima(desafio: DesafioMonte, montadas: number, peca: Peca): boolean {
  return desafio.palavra.silabas[montadas] === peca.silaba
}

export function instrucao(desafio: DesafioMonte): { texto: string; fala: string } {
  const nome = falaDaCarta({ figura: desafio.palavra.figura }).replace('.', '').toLowerCase()
  return { texto: 'Monte o nome da figura.', fala: `Monte a palavra ${nome}.` }
}

export function falas(): string[] {
  const todas = [...DUAS, ...TRES]
  return [
    ...todas.map((palavra) => instrucao({ palavra, pecas: [] }).fala),
    ...todas.map((palavra) => falaDaCarta({ figura: palavra.figura })),
  ]
}
