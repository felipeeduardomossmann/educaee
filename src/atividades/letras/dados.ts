import type { NomeFigura } from '../../lib/figuras'

/** Uma opção da atividade: o que aparece (maiúsculas de imprensa) e como a voz fala. */
export interface ItemLetras {
  texto: string
  fala: string
  /** Só no nível 4 (palavras): a figura que representa a palavra. */
  figura?: NomeFigura
}

/** Nível 1: vogais. A fala usa o nome da letra, com acento para a voz ler aberto. */
export const VOGAIS: readonly ItemLetras[] = [
  { texto: 'A', fala: 'á' },
  { texto: 'E', fala: 'é' },
  { texto: 'I', fala: 'i' },
  { texto: 'O', fala: 'ó' },
  { texto: 'U', fala: 'u' },
]

/** Nível 2: consoantes comuns, com o nome de cada letra. */
export const CONSOANTES: readonly ItemLetras[] = [
  { texto: 'B', fala: 'bê' },
  { texto: 'C', fala: 'cê' },
  { texto: 'D', fala: 'dê' },
  { texto: 'F', fala: 'éfe' },
  { texto: 'G', fala: 'gê' },
  { texto: 'L', fala: 'éle' },
  { texto: 'M', fala: 'ême' },
  { texto: 'N', fala: 'êne' },
  { texto: 'P', fala: 'pê' },
  { texto: 'R', fala: 'érre' },
  { texto: 'S', fala: 'ésse' },
  { texto: 'T', fala: 'tê' },
  { texto: 'V', fala: 'vê' },
]

/** Nível 3: sílabas com consoantes de som regular (sem C, G, R e S). */
const CONSOANTES_SILABAS = ['B', 'D', 'F', 'L', 'M', 'N', 'P', 'T', 'V']
const VOGAIS_SILABAS: readonly [string, string][] = [
  ['A', 'á'],
  ['E', 'é'],
  ['I', 'i'],
  ['O', 'ó'],
  ['U', 'u'],
]

export const SILABAS: readonly ItemLetras[] = CONSOANTES_SILABAS.flatMap((consoante) =>
  VOGAIS_SILABAS.map(([vogal, falaVogal]) => ({
    texto: consoante + vogal,
    fala: consoante.toLowerCase() + falaVogal,
  })),
)

/** Nível 4: palavras simples com figura. */
export const PALAVRAS: readonly ItemLetras[] = [
  { texto: 'BOLA', fala: 'bola', figura: 'bola' },
  { texto: 'GATO', fala: 'gato', figura: 'gato' },
  { texto: 'PATO', fala: 'pato', figura: 'pato' },
  { texto: 'SAPO', fala: 'sapo', figura: 'sapo' },
  { texto: 'CASA', fala: 'casa', figura: 'casa' },
  { texto: 'DADO', fala: 'dado', figura: 'dado' },
  { texto: 'MALA', fala: 'mala', figura: 'mala' },
  { texto: 'VACA', fala: 'vaca', figura: 'vaca' },
  { texto: 'FOCA', fala: 'foca', figura: 'foca' },
  { texto: 'LUA', fala: 'lua', figura: 'lua' },
  { texto: 'SOL', fala: 'sol', figura: 'sol' },
  { texto: 'PÉ', fala: 'pé', figura: 'pe' },
]
