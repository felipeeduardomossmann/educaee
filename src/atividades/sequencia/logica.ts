import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { NOMES_FORMAS, type NomeForma } from './formas'

export type ItemSequencia =
  { tipo: 'forma'; forma: NomeForma } | { tipo: 'figura'; figura: NomeFigura }

export const OPCOES = 3

/** Nível 4: "AAB AAB AA_ e similares". */
export const PADROES_NIVEL_4 = ['AAB', 'ABB', 'ABA', 'AABB'] as const

export interface DesafioSequencia {
  padrao: string
  /** O que aparece antes do espaço vazio. */
  sequencia: ItemSequencia[]
  resposta: ItemSequencia
  opcoes: ItemSequencia[]
}

export function chaveItem(item: ItemSequencia): string {
  return item.tipo === 'forma' ? `forma:${item.forma}` : `figura:${item.figura}`
}

/** 1 = AB AB A_ (cores) · 2 = AB AB A_ (figuras) · 3 = ABC ABC AB_ · 4 = AAB AAB AA_ e similares. */
function padraoDoNivel(nivel: number, aleatorio?: Aleatorio): string {
  if (nivel <= 2) return 'AB'
  if (nivel === 3) return 'ABC'
  return sortear(PADROES_NIVEL_4, 1, aleatorio)[0] ?? 'AAB'
}

/** Sequência: o padrão duas vezes e o começo da terceira; falta o último. */
export function criarDesafio(
  nivel: number,
  figurasDoTema: readonly NomeFigura[],
  aleatorio?: Aleatorio,
): DesafioSequencia {
  const padrao = padraoDoNivel(nivel, aleatorio)
  const letras = [...new Set(padrao)]
  const conjunto: ItemSequencia[] =
    nivel <= 1
      ? NOMES_FORMAS.map((forma) => ({ tipo: 'forma', forma }))
      : figurasDoTema.map((figura) => ({ tipo: 'figura', figura }))

  // Um item para cada letra do padrão e mais um "de fora" para as opções.
  const sorteados = sortear(conjunto, letras.length + 1, aleatorio)
  const itemDe = (letra: string) => sorteados[letras.indexOf(letra)] as ItemSequencia
  const extra = sorteados[letras.length] as ItemSequencia

  const completa = padrao + padrao + padrao
  const sequencia = [...completa.slice(0, -1)].map(itemDe)
  const resposta = itemDe(padrao.at(-1) ?? 'A')

  const outrasDoPadrao = letras.map(itemDe).filter((item) => item !== resposta)
  const distracoes = [...outrasDoPadrao, extra].slice(0, OPCOES - 1)

  return { padrao, sequencia, resposta, opcoes: embaralhar([resposta, ...distracoes], aleatorio) }
}

/** Instrução falada (e mostrada) a cada rodada. */
export const INSTRUCAO = 'O que vem depois? Toque na resposta.'

/** Todas as falas desta atividade (para o catálogo de áudios gravados). */
export function falas(): string[] {
  return [INSTRUCAO]
}
