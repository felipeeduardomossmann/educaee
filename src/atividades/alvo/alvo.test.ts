import { describe, expect, it } from 'vitest'
import { TEMAS } from '../../lib/temas'
import {
  ladoDoAlvo,
  mover,
  posicaoAleatoria,
  proximaFigura,
  VELOCIDADE_PX_S,
  type Movimento,
} from './logica'

function sequencia(semente = 11) {
  let x = semente
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

describe('ladoDoAlvo', () => {
  it('diminui do nível 1 ao 3', () => {
    const [n1, n2, n3] = [1, 2, 3].map((nivel) => ladoDoAlvo(nivel, 600, 64))
    expect(n1).toBeGreaterThan(n2 ?? 0)
    expect(n2).toBeGreaterThan(n3 ?? 0)
  })

  it('nunca fica abaixo da área de toque do perfil', () => {
    expect(ladoDoAlvo(3, 300, 120)).toBe(120)
    expect(ladoDoAlvo(4, 200, 88)).toBe(88)
  })
})

describe('posicaoAleatoria', () => {
  it('fica entre 0 e 1 e longe da anterior', () => {
    const aleatorio = sequencia()
    let anterior = posicaoAleatoria(null, aleatorio)
    for (let i = 0; i < 50; i++) {
      const nova = posicaoAleatoria(anterior, aleatorio)
      expect(nova.x).toBeGreaterThanOrEqual(0)
      expect(nova.x).toBeLessThanOrEqual(1)
      expect(Math.hypot(nova.x - anterior.x, nova.y - anterior.y)).toBeGreaterThanOrEqual(0.35)
      anterior = nova
    }
  })
})

describe('mover', () => {
  it('anda devagar e quica nas bordas', () => {
    const inicio: Movimento = { posicao: { x: 0.95, y: 0.5 }, vx: VELOCIDADE_PX_S, vy: 0 }
    // 1 s a 60 px/s num espaço de 600 px = 0,1 → passaria de 1, então quica.
    const depois = mover(inicio, 1, 600, 400)
    expect(depois.posicao.x).toBe(1)
    expect(depois.vx).toBe(-VELOCIDADE_PX_S)
    const volta = mover(depois, 1, 600, 400)
    expect(volta.posicao.x).toBeCloseTo(0.9)
  })
})

describe('proximaFigura', () => {
  it('nunca repete a figura anterior', () => {
    const aleatorio = sequencia()
    let anterior = proximaFigura(TEMAS.veiculos.figuras, null, aleatorio)
    for (let i = 0; i < 50; i++) {
      const nova = proximaFigura(TEMAS.veiculos.figuras, anterior, aleatorio)
      expect(nova).not.toBe(anterior)
      anterior = nova
    }
  })
})
