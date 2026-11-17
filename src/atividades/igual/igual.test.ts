import { describe, expect, it } from 'vitest'
import { distanciaCor, mediaDosPixels, type Rgb } from '../../lib/cor-figura'
import type { NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { criarDesafio, maisParecidas, OPCOES_POR_NIVEL } from './logica'

function sequencia(semente = 7) {
  let x = semente
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

const figuras = TEMAS.frutas.figuras

describe('criarDesafio', () => {
  it.each([1, 2, 3, 4])('nível %i: número certo de opções, modelo uma vez só', (nivel) => {
    const { modelo, opcoes } = criarDesafio(figuras, nivel, null, {}, sequencia(nivel))
    expect(opcoes).toHaveLength(OPCOES_POR_NIVEL[nivel] ?? 0)
    expect(new Set(opcoes).size).toBe(opcoes.length)
    expect(opcoes.filter((figura) => figura === modelo)).toHaveLength(1)
  })

  it('nunca repete o modelo da jogada anterior', () => {
    const aleatorio = sequencia()
    let anterior: NomeFigura | null = null
    for (let i = 0; i < 50; i++) {
      const { modelo } = criarDesafio(figuras, 2, anterior, {}, aleatorio)
      expect(modelo).not.toBe(anterior)
      anterior = modelo
    }
  })

  it('nível 4 usa figuras de cores parecidas com o modelo', () => {
    // Vermelhos perto do modelo (maçã); verdes e amarelos longe.
    const cores: Partial<Record<NomeFigura, Rgb>> = {
      maca: [220, 40, 40],
      morango: [225, 50, 45],
      cereja: [200, 30, 50],
      melancia: [230, 70, 60],
      pessego: [240, 120, 90],
      laranja: [250, 140, 30],
      kiwi: [120, 160, 40],
      limao: [240, 220, 50],
      pera: [180, 210, 60],
      banana: [250, 220, 90],
      uva: [120, 60, 160],
      abacaxi: [230, 180, 50],
      manga: [240, 170, 40],
    }
    const semMaca = figuras.filter((figura) => figura !== 'maca')
    const proximas = maisParecidas('maca', semMaca, cores).slice(0, 5)
    expect(proximas.slice(0, 3)).toEqual(['morango', 'cereja', 'melancia'])

    // Em várias jogadas, as 5 distrações são sempre as 5 mais parecidas com o modelo.
    const aleatorio = sequencia(3)
    for (let i = 0; i < 30; i++) {
      const { modelo, opcoes } = criarDesafio(figuras, 4, null, cores, aleatorio)
      const outras = figuras.filter((figura) => figura !== modelo)
      const cinco = maisParecidas(modelo, outras, cores).slice(0, 5)
      const distracoes = opcoes.filter((figura) => figura !== modelo)
      expect(distracoes).toHaveLength(5)
      expect([...distracoes].sort()).toEqual([...cinco].sort())
    }
  })
})

describe('cores', () => {
  it('ignora pixels transparentes e quase pretos', () => {
    const pixels = [
      ...[255, 0, 0, 255], // vermelho
      ...[0, 0, 255, 255], // azul
      ...[10, 10, 10, 255], // contorno: ignorado
      ...[0, 255, 0, 0], // transparente: ignorado
    ]
    expect(mediaDosPixels(pixels)).toEqual([127.5, 0, 127.5])
  })

  it('cores iguais têm distância zero e diferentes, maior', () => {
    expect(distanciaCor([10, 20, 30], [10, 20, 30])).toBe(0)
    expect(distanciaCor([255, 0, 0], [250, 10, 10])).toBeLessThan(
      distanciaCor([255, 0, 0], [0, 200, 0]),
    )
  })
})
