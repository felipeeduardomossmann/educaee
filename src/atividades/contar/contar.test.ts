import { describe, expect, it } from 'vitest'
import { TEMAS } from '../../lib/temas'
import {
  criarDesafio,
  falas,
  instrucao,
  MAXIMO_POR_NIVEL,
  respostaCerta,
  type DesafioContar,
} from './logica'

const figuras = TEMAS.frutas.figuras

describe('Contar', () => {
  it('nos níveis 1 a 3, conta dentro do limite e a resposta está nas opções', () => {
    for (const nivel of [1, 2, 3]) {
      for (let i = 0; i < 40; i++) {
        const d = criarDesafio(figuras, nivel, null)
        if (d.tipo !== 'quantos') throw new Error('tipo')
        expect(d.quantidade).toBeGreaterThanOrEqual(1)
        expect(d.quantidade).toBeLessThanOrEqual(MAXIMO_POR_NIVEL[nivel])
        expect(d.opcoes).toContain(d.quantidade)
        expect(new Set(d.opcoes).size).toBe(d.opcoes.length)
        expect(respostaCerta(d)).toBe(String(d.quantidade))
      }
    }
  })

  it('no nível 4, os grupos têm tamanhos diferentes e a resposta é o maior', () => {
    for (let i = 0; i < 40; i++) {
      const d = criarDesafio(figuras, 4, null)
      if (d.tipo !== 'mais') throw new Error('tipo')
      expect(d.grupos[0]).not.toBe(d.grupos[1])
      expect(respostaCerta(d)).toBe(d.grupos[0] > d.grupos[1] ? '0' : '1')
    }
  })

  it('pergunta com o gênero certo e as falas estão no catálogo', () => {
    const maca: DesafioContar = {
      tipo: 'quantos',
      figura: 'maca',
      quantidade: 2,
      opcoes: [1, 2, 3],
    }
    expect(instrucao(maca).fala).toBe('Quantas maçãs? Toque no número.')
    expect(instrucao({ ...maca, figura: 'limao' }).fala).toBe('Quantos limões? Toque no número.')
    expect(falas()).toContain('Qual grupo tem mais bananas?')
  })
})
