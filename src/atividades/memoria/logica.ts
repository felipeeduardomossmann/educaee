import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { nomeFalado } from '../../lib/nomes-falados'
import { TEMAS } from '../../lib/temas'

/** Nível 1 = 2 pares · 2 = 4 · 3 = 6 · 4 = 8. */
export const PARES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 4, 3: 6, 4: 8 }

export interface Carta {
  figura: NomeFigura
  encontrada: boolean
  /** Chave do par (sem ela, o par é a mesma figura). Ex.: cachorro e osso têm a mesma chave. */
  par?: string
  /** Mostra a figura como sombra (silhueta preta). */
  sombra?: boolean
}

const chaveDoPar = (carta: Carta) => carta.par ?? carta.figura

export interface EstadoMemoria {
  cartas: Carta[]
  /** Índices das cartas viradas para cima que ainda não formaram par (0, 1 ou 2). */
  viradas: number[]
  /** Duas cartas diferentes estão abertas, esperando para desvirar. */
  aguardandoDesvirar: boolean
}

export type EventoMemoria = 'nada' | 'virou' | 'par' | 'erro' | 'fim'

export function criarJogo(
  figurasDoTema: readonly NomeFigura[],
  pares: number,
  aleatorio?: Aleatorio,
): EstadoMemoria {
  const figuras = sortear(figurasDoTema, pares, aleatorio)
  const cartas = embaralhar([...figuras, ...figuras], aleatorio).map((figura) => ({
    figura,
    encontrada: false,
  }))
  return { cartas, viradas: [], aguardandoDesvirar: false }
}

/** O aluno tocou numa carta. Devolve o novo estado e o que aconteceu. */
export function tocarCarta(
  estado: EstadoMemoria,
  indice: number,
): { estado: EstadoMemoria; evento: EventoMemoria } {
  const carta = estado.cartas[indice]
  const nada = { estado, evento: 'nada' as const }
  if (!carta || carta.encontrada || estado.aguardandoDesvirar || estado.viradas.includes(indice)) {
    return nada
  }

  const [primeira] = estado.viradas
  if (primeira === undefined) {
    return { estado: { ...estado, viradas: [indice] }, evento: 'virou' }
  }

  const outra = estado.cartas[primeira]
  if (outra && chaveDoPar(outra) === chaveDoPar(carta)) {
    const cartas = estado.cartas.map((c, i) =>
      i === indice || i === primeira ? { ...c, encontrada: true } : c,
    )
    const fim = cartas.every((c) => c.encontrada)
    return { estado: { ...estado, cartas, viradas: [] }, evento: fim ? 'fim' : 'par' }
  }

  return {
    estado: { ...estado, viradas: [primeira, indice], aguardandoDesvirar: true },
    evento: 'erro',
  }
}

/** Desvira as duas cartas diferentes. */
export function desvirar(estado: EstadoMemoria): EstadoMemoria {
  return { ...estado, viradas: [], aguardandoDesvirar: false }
}

/** Instrução falada (e mostrada) a cada rodada. */
export const INSTRUCAO = 'Encontre os pares iguais. Toque em duas cartas.'

/** "Espiar": nos níveis 1 e 2, todas as cartas ficam abertas um pouco antes de virar. */
export const NIVEIS_ESPIAR = [1, 2]
export const ESPIAR_MS = 3500
export const FALA_ESPIAR = 'Olhe bem as cartas!'

/** O nome falado ao virar cada carta. */
export function falaDaCarta(carta: Pick<Carta, 'figura' | 'sombra'>): string {
  const { nome } = nomeFalado(carta.figura)
  return carta.sombra ? `Sombra: ${nome}.` : `${nome[0].toUpperCase()}${nome.slice(1)}.`
}

export function figurasDosTemas(): NomeFigura[] {
  return [...new Set(Object.values(TEMAS).flatMap((t) => t.figuras))]
}

/** Todas as falas desta atividade (para o catálogo de áudios gravados). */
export function falas(): string[] {
  return [INSTRUCAO, FALA_ESPIAR, ...figurasDosTemas().map((figura) => falaDaCarta({ figura }))]
}
