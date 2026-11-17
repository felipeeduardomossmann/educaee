import { describe, expect, it } from 'vitest'
import { avaliarSugestao, taxaAcerto } from './sugestao'

const r = (acertos: number, erros: number) => ({ acertos, erros })

describe('taxaAcerto', () => {
  it('é acertos / (acertos + erros)', () => {
    expect(taxaAcerto(r(9, 1))).toBe(0.9)
    expect(taxaAcerto(r(0, 0))).toBe(0)
  })
})

describe('avaliarSugestao (atividades em geral)', () => {
  it('sugere subir com ≥ 90% nas 2 últimas rodadas do nível', () => {
    expect(avaliarSugestao('igual', 2, [r(8, 0), r(9, 1)])).toEqual({ tipo: 'subir', nivelNovo: 3 })
  })

  it('não sugere subir com só uma rodada boa', () => {
    expect(avaliarSugestao('igual', 2, [r(8, 0)])).toBeNull()
    expect(avaliarSugestao('igual', 2, [r(8, 0), r(8, 2)])).toBeNull() // 80% na penúltima
  })

  it('não sugere subir no nível máximo', () => {
    expect(avaliarSugestao('letras', 4, [r(8, 0), r(8, 0)])).toBeNull()
  })

  it('sugere descer com menos de 50% na última rodada', () => {
    expect(avaliarSugestao('alvo', 3, [r(8, 9)])).toEqual({ tipo: 'descer', nivelNovo: 2 })
  })

  it('50% exatos não é difícil', () => {
    expect(avaliarSugestao('alvo', 3, [r(8, 8)])).toBeNull()
  })

  it('não sugere descer no nível 1', () => {
    expect(avaliarSugestao('sequencia', 1, [r(8, 20)])).toBeNull()
  })

  it('sem rodadas, nenhuma sugestão', () => {
    expect(avaliarSugestao('igual', 2, [])).toBeNull()
  })
})

describe('avaliarSugestao (jogo da memória)', () => {
  // Nível 2 = 4 pares: fácil com até 4 erros; difícil com 12 erros ou mais.
  it('fácil: erros ≤ número de pares, nas 2 últimas rodadas', () => {
    expect(avaliarSugestao('memoria', 2, [r(4, 4), r(4, 3)])).toEqual({
      tipo: 'subir',
      nivelNovo: 3,
    })
    expect(avaliarSugestao('memoria', 2, [r(4, 5), r(4, 3)])).toBeNull()
  })

  it('difícil: erros ≥ 3 × número de pares', () => {
    expect(avaliarSugestao('memoria', 2, [r(4, 12)])).toEqual({ tipo: 'descer', nivelNovo: 1 })
    expect(avaliarSugestao('memoria', 2, [r(4, 11)])).toBeNull()
  })

  it('a taxa de acerto não vale na memória (4 acertos e 3 erros = 57%, mas é fácil)', () => {
    expect(avaliarSugestao('memoria', 2, [r(4, 3), r(4, 3)])?.tipo).toBe('subir')
  })
})
