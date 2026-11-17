import { PARES_POR_NIVEL } from '../atividades/memoria/logica'
import { PARES_POR_NIVEL as PARES_ASSOCIADOS_POR_NIVEL } from '../atividades/pares/logica'
import { NIVEL_MAXIMO, NIVEL_MINIMO, type AtividadeId } from './atividade'

/** O que importa de uma rodada para a sugestão. */
export interface RodadaAvaliada {
  acertos: number
  erros: number
}

export interface Sugestao {
  tipo: 'subir' | 'descer'
  nivelNovo: number
}

/** Taxa de acerto: acertos / (acertos + erros). Sem jogadas, 0. */
export function taxaAcerto({ acertos, erros }: RodadaAvaliada): number {
  const total = acertos + erros
  return total === 0 ? 0 : acertos / total
}

const TAXA_FACIL = 0.9
const TAXA_DIFICIL = 0.5

/** Pares do tabuleiro nas atividades de memória, onde errar faz parte; senão, null. */
export function paresDaMemoria(atividadeId: AtividadeId, nivel: number): number | null {
  if (atividadeId === 'memoria') return PARES_POR_NIVEL[nivel] ?? 4
  if (atividadeId === 'pares') return PARES_ASSOCIADOS_POR_NIVEL[nivel] ?? 4
  return null
}

function facil(atividadeId: AtividadeId, nivel: number, rodada: RodadaAvaliada): boolean {
  const pares = paresDaMemoria(atividadeId, nivel)
  if (pares !== null) return rodada.erros <= pares
  return taxaAcerto(rodada) >= TAXA_FACIL
}

function dificil(atividadeId: AtividadeId, nivel: number, rodada: RodadaAvaliada): boolean {
  const pares = paresDaMemoria(atividadeId, nivel)
  if (pares !== null) return rodada.erros >= 3 * pares
  return taxaAcerto(rodada) < TAXA_DIFICIL
}

/**
 * Sugestão de nível: subir se as 2 últimas rodadas do nível foram fáceis; descer se a última
 * foi difícil. `rodadas` vem da mais recente para a mais antiga.
 */
export function avaliarSugestao(
  atividadeId: AtividadeId,
  nivel: number,
  rodadas: readonly RodadaAvaliada[],
): Sugestao | null {
  const [ultima, penultima] = rodadas
  if (!ultima) return null
  if (nivel < NIVEL_MAXIMO && penultima) {
    if (facil(atividadeId, nivel, ultima) && facil(atividadeId, nivel, penultima)) {
      return { tipo: 'subir', nivelNovo: nivel + 1 }
    }
  }
  if (nivel > NIVEL_MINIMO && dificil(atividadeId, nivel, ultima)) {
    return { tipo: 'descer', nivelNovo: nivel - 1 }
  }
  return null
}
