import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

// Sons das palavras (consciência fonológica): sílaba inicial (níveis 1 e 2) e rima (3 e 4).

export interface Palavra {
  figura: NomeFigura
  texto: string
  /** Sílaba inicial: como aparece e como a voz fala (vogal aberta, como em Letras). */
  silaba: { texto: string; fala: string }
}

export const PALAVRAS: readonly Palavra[] = [
  { figura: 'banana', texto: 'BANANA', silaba: { texto: 'BA', fala: 'bá' } },
  { figura: 'bola', texto: 'BOLA', silaba: { texto: 'BO', fala: 'bó' } },
  { figura: 'gato', texto: 'GATO', silaba: { texto: 'GA', fala: 'gá' } },
  { figura: 'pato', texto: 'PATO', silaba: { texto: 'PA', fala: 'pá' } },
  { figura: 'sapo', texto: 'SAPO', silaba: { texto: 'SA', fala: 'sá' } },
  { figura: 'vaca', texto: 'VACA', silaba: { texto: 'VA', fala: 'vá' } },
  { figura: 'macaco', texto: 'MACACO', silaba: { texto: 'MA', fala: 'má' } },
  { figura: 'dado', texto: 'DADO', silaba: { texto: 'DA', fala: 'dá' } },
  { figura: 'foca', texto: 'FOCA', silaba: { texto: 'FO', fala: 'fó' } },
  { figura: 'lua', texto: 'LUA', silaba: { texto: 'LU', fala: 'lu' } },
  { figura: 'casa', texto: 'CASA', silaba: { texto: 'CA', fala: 'cá' } },
  { figura: 'pipoca', texto: 'PIPOCA', silaba: { texto: 'PI', fala: 'pi' } },
  { figura: 'janela', texto: 'JANELA', silaba: { texto: 'JA', fala: 'já' } },
  { figura: 'vela', texto: 'VELA', silaba: { texto: 'VE', fala: 'vé' } },
  { figura: 'tartaruga', texto: 'TARTARUGA', silaba: { texto: 'TA', fala: 'tá' } },
  { figura: 'rato', texto: 'RATO', silaba: { texto: 'RA', fala: 'rá' } },
  { figura: 'pao', texto: 'PÃO', silaba: { texto: 'PÃO', fala: 'pão' } },
  { figura: 'mao', texto: 'MÃO', silaba: { texto: 'MÃO', fala: 'mão' } },
  { figura: 'mel', texto: 'MEL', silaba: { texto: 'MEL', fala: 'mél' } },
  { figura: 'anel', texto: 'ANEL', silaba: { texto: 'A', fala: 'á' } },
  { figura: 'sol', texto: 'SOL', silaba: { texto: 'SOL', fala: 'sól' } },
  { figura: 'anzol', texto: 'ANZOL', silaba: { texto: 'AN', fala: 'ã' } },
]

/** Palavras que rimam entre si. */
export const RIMAS: readonly NomeFigura[][] = [
  ['gato', 'pato', 'rato'],
  ['pao', 'mao'],
  ['vela', 'janela'],
  ['foca', 'pipoca'],
  ['mel', 'anel'],
  ['sol', 'anzol'],
]

/** Só as palavras de sílaba inicial simples entram nos níveis 1 e 2. */
const PARA_SILABA = PALAVRAS.filter((p) => p.silaba.texto.length === 2)
const palavra = (figura: NomeFigura) => PALAVRAS.find((p) => p.figura === figura) as Palavra
const grupoDaRima = (figura: NomeFigura) => RIMAS.find((g) => g.includes(figura)) ?? []

export const OPCOES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 3, 3: 2, 4: 3 }
export const NIVEL_RIMA = 3

export type DesafioSons =
  | { tipo: 'silaba'; certa: Palavra; opcoes: Palavra[] }
  | { tipo: 'rima'; modelo: Palavra; certa: Palavra; opcoes: Palavra[] }

export function criarDesafio(
  nivel: number,
  anterior: DesafioSons | null,
  aleatorio?: Aleatorio,
): DesafioSons {
  const quantidade = OPCOES_POR_NIVEL[nivel] ?? 2
  if (nivel >= NIVEL_RIMA) {
    const grupos = RIMAS.filter((g) => !g.includes(anterior?.certa.figura as NomeFigura))
    const [grupo] = sortear(grupos, 1, aleatorio) as [NomeFigura[]]
    const [modelo, certa] = sortear(grupo, 2, aleatorio).map(palavra) as [Palavra, Palavra]
    // Distrações: não rimam com o modelo.
    const outras = sortear(
      PALAVRAS.filter((p) => !grupo.includes(p.figura)),
      quantidade - 1,
      aleatorio,
    )
    return { tipo: 'rima', modelo, certa, opcoes: embaralhar([certa, ...outras], aleatorio) }
  }
  const [certa] = sortear(
    PARA_SILABA.filter((p) => p.figura !== anterior?.certa.figura),
    1,
    aleatorio,
  ) as [Palavra]
  // Distrações: começam com outra sílaba.
  const outras = sortear(
    PARA_SILABA.filter((p) => p.silaba.texto !== certa.silaba.texto),
    quantidade - 1,
    aleatorio,
  )
  return { tipo: 'silaba', certa, opcoes: embaralhar([certa, ...outras], aleatorio) }
}

export function instrucao(desafio: DesafioSons): { texto: string; fala: string } {
  if (desafio.tipo === 'rima') {
    return {
      texto: `Qual rima com ${desafio.modelo.texto}?`,
      fala: `Qual rima com ${desafio.modelo.texto.toLowerCase()}?`,
    }
  }
  return {
    texto: `Qual começa com ${desafio.certa.silaba.texto}?`,
    fala: `Qual começa com ${desafio.certa.silaba.fala}?`,
  }
}

export function rimam(a: NomeFigura, b: NomeFigura): boolean {
  return a !== b && grupoDaRima(a).includes(b)
}

export function falas(): string[] {
  return [
    ...PARA_SILABA.map((certa) => instrucao({ tipo: 'silaba', certa, opcoes: [] }).fala),
    ...RIMAS.flat().map(
      (f) => instrucao({ tipo: 'rima', modelo: palavra(f), certa: palavra(f), opcoes: [] }).fala,
    ),
  ]
}
