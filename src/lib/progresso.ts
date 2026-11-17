import type { Sessao } from './sessoes'
import { taxaAcerto } from './sugestao'

export type Periodo = '7' | '30' | 'tudo'

export const PERIODOS: readonly { valor: Periodo; rotulo: string }[] = [
  { valor: '7', rotulo: 'Últimos 7 dias' },
  { valor: '30', rotulo: 'Últimos 30 dias' },
  { valor: 'tudo', rotulo: 'Tudo' },
]

const DIA_MS = 24 * 60 * 60 * 1000

/** Rodadas dentro do período (últimos N dias contando a partir de agora). */
export function filtrarPeriodo(
  sessoes: readonly Sessao[],
  periodo: Periodo,
  agora: Date = new Date(),
): Sessao[] {
  if (periodo === 'tudo') return [...sessoes]
  const inicio = agora.getTime() - Number(periodo) * DIA_MS
  return sessoes.filter((sessao) => sessao.concluidaEm.getTime() >= inicio)
}

export interface ResumoAtividade {
  rodadas: number
  /** Média das taxas de acerto de cada rodada (0 a 1), ou null sem rodadas. */
  taxaMedia: number | null
}

export function resumir(sessoes: readonly Sessao[]): ResumoAtividade {
  if (sessoes.length === 0) return { rodadas: 0, taxaMedia: null }
  const soma = sessoes.reduce((total, sessao) => total + taxaAcerto(sessao), 0)
  return { rodadas: sessoes.length, taxaMedia: soma / sessoes.length }
}

export interface PontoGrafico {
  /** Número da rodada no período (1 = a mais antiga). */
  rodada: number
  /** Taxa de acerto em % (0 a 100), arredondada. */
  taxa: number
  nivel: number
  data: Date
}

/** Pontos do gráfico em ordem cronológica (a lista chega da mais nova para a mais antiga). */
export function serieGrafico(sessoes: readonly Sessao[]): PontoGrafico[] {
  return [...sessoes]
    .sort((a, b) => a.concluidaEm.getTime() - b.concluidaEm.getTime())
    .map((sessao, indice) => ({
      rodada: indice + 1,
      taxa: Math.round(taxaAcerto(sessao) * 100),
      nivel: sessao.nivel,
      data: sessao.concluidaEm,
    }))
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatarData(data: Date): string {
  return formatoData.format(data)
}

export function formatarDataHora(data: Date): string {
  return formatoDataHora.format(data)
}

export function formatarPorcentagem(taxa: number): string {
  return `${Math.round(taxa * 100)}%`
}
