import { describe, expect, it } from 'vitest'
import {
  filtrarPeriodo,
  formatarData,
  formatarPorcentagem,
  resumir,
  serieGrafico,
} from './progresso'
import type { Sessao } from './sessoes'

const AGORA = new Date('2026-11-20T12:00:00')

function sessao(diasAtras: number, acertos: number, erros: number, nivel = 1): Sessao {
  return {
    id: String(diasAtras),
    atividadeId: 'igual',
    nivel,
    acertos,
    erros,
    duracaoSeg: 60,
    concluidaEm: new Date(AGORA.getTime() - diasAtras * 24 * 60 * 60 * 1000),
  }
}

// Da mais nova para a mais antiga, como chegam do banco.
const SESSOES = [sessao(1, 8, 0, 2), sessao(5, 8, 2), sessao(20, 8, 8), sessao(60, 4, 4)]

describe('filtrarPeriodo', () => {
  it('filtra pelos últimos 7 ou 30 dias, ou mostra tudo', () => {
    expect(filtrarPeriodo(SESSOES, '7', AGORA)).toHaveLength(2)
    expect(filtrarPeriodo(SESSOES, '30', AGORA)).toHaveLength(3)
    expect(filtrarPeriodo(SESSOES, 'tudo', AGORA)).toHaveLength(4)
  })
})

describe('resumir', () => {
  it('conta as rodadas e faz a média das taxas de cada rodada', () => {
    // 100%, 80%, 50%, 50% → média 70%
    expect(resumir(SESSOES)).toEqual({ rodadas: 4, taxaMedia: 0.7 })
  })

  it('sem rodadas, sem média', () => {
    expect(resumir([])).toEqual({ rodadas: 0, taxaMedia: null })
  })
})

describe('serieGrafico', () => {
  it('fica em ordem cronológica, com a taxa em %', () => {
    const serie = serieGrafico(SESSOES)
    expect(serie.map((p) => p.taxa)).toEqual([50, 50, 80, 100])
    expect(serie.map((p) => p.rodada)).toEqual([1, 2, 3, 4])
    expect(serie.at(-1)?.nivel).toBe(2)
  })
})

describe('formatação', () => {
  it('usa o formato brasileiro', () => {
    expect(formatarData(new Date('2026-03-05T10:00:00'))).toBe('05/03/2026')
    expect(formatarPorcentagem(0.875)).toBe('88%')
  })
})
