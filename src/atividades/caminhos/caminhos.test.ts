import { describe, expect, it } from 'vitest'
import {
  avancar,
  CAMINHOS_POR_NIVEL,
  falas,
  instrucao,
  sortearCaminho,
  tolerancia,
  type Ponto,
} from './logica'

// Uma linha reta de x = 0 a x = 100, um ponto a cada 1 unidade.
const reta: Ponto[] = Array.from({ length: 101 }, (_, x) => ({ x, y: 0 }))

describe('avancar', () => {
  it('anda até o ponto mais perto do dedo, um pouco à frente', () => {
    expect(avancar(reta, 0, { x: 20, y: 5 }, 10)).toBe(20)
  })

  it('fora do caminho, a figura fica onde está (sem erro)', () => {
    expect(avancar(reta, 10, { x: 20, y: 80 }, 10)).toBe(10)
  })

  it('não pula para longe nem volta', () => {
    expect(avancar(reta, 10, { x: 90, y: 0 }, 10, 40)).toBe(10)
    expect(avancar(reta, 30, { x: 5, y: 0 }, 10)).toBe(30)
  })
})

describe('tolerancia', () => {
  it('é mais larga nos níveis fáceis e nunca menor que a área de toque', () => {
    expect(tolerancia(1, 48, 1)).toBeGreaterThan(tolerancia(4, 48, 1))
    // Tela pequena (0,3 px por unidade) e área de toque de 96 px: 96 × 0,9 / 0,3 / 2 = 144
    expect(tolerancia(4, 96, 0.3)).toBeCloseTo(144)
  })
})

describe('caminhos', () => {
  it('cada nível tem caminhos e não repete o anterior', () => {
    for (const nivel of [1, 2, 3, 4]) {
      expect(CAMINHOS_POR_NIVEL[nivel].length).toBeGreaterThan(1)
      const a = sortearCaminho(nivel, null)
      expect(sortearCaminho(nivel, a).id).not.toBe(a.id)
    }
  })

  it('o nível 4 são letras, com o nome falado; as falas estão no catálogo', () => {
    const o = CAMINHOS_POR_NIVEL[4].find((c) => c.id === 'O')
    if (!o) throw new Error('sem O')
    expect(instrucao(o)).toEqual({
      texto: 'Passe o dedo pela letra O.',
      fala: 'Passe o dedo pela letra ó.',
    })
    for (const c of CAMINHOS_POR_NIVEL[4]) expect(falas()).toContain(instrucao(c).fala)
  })
})
