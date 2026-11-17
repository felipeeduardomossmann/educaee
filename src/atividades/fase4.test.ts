import { describe, expect, it } from 'vitest'
import { TEMAS } from '../lib/temas'
import * as faltando from './faltando/logica'
import * as monte from './monte/logica'
import * as rotina from './rotina/logica'
import * as segure from './segure/logica'
import * as sombra from './sombra/logica'
import * as sons from './sons/logica'

const figuras = TEMAS.animais.figuras

describe('Qual é a sombra?', () => {
  it('a resposta está entre as opções, sem repetir', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const d = sombra.criarDesafio(figuras, nivel, null)
      expect(d.opcoes).toHaveLength(sombra.OPCOES_POR_NIVEL[nivel])
      expect(d.opcoes).toContain(d.modelo)
      expect(new Set(d.opcoes).size).toBe(d.opcoes.length)
    }
  })
})

describe('O que está faltando?', () => {
  it('a figura que some está nas opções; as outras opções não estavam na fileira', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const d = faltando.criarDesafio(figuras, nivel, null)
      const { figuras: n, opcoes: m } = faltando.CONFIG_POR_NIVEL[nivel]
      expect(d.fileira).toHaveLength(n)
      expect(d.opcoes).toHaveLength(m)
      const sumiu = d.fileira[d.sumiu]
      expect(d.opcoes).toContain(sumiu)
      for (const o of d.opcoes) if (o !== sumiu) expect(d.fileira).not.toContain(o)
    }
  })
})

describe('Sons das palavras', () => {
  it('sílaba: só a resposta começa com a sílaba pedida', () => {
    for (let i = 0; i < 30; i++) {
      const d = sons.criarDesafio(2, null)
      if (d.tipo !== 'silaba') throw new Error('tipo')
      const comSilaba = d.opcoes.filter((p) => p.silaba.texto === d.certa.silaba.texto)
      expect(comSilaba).toEqual([d.certa])
    }
  })

  it('rima: só a resposta rima com o modelo', () => {
    for (let i = 0; i < 30; i++) {
      const d = sons.criarDesafio(4, null)
      if (d.tipo !== 'rima') throw new Error('tipo')
      expect(sons.rimam(d.modelo.figura, d.certa.figura)).toBe(true)
      for (const o of d.opcoes) {
        if (o !== d.certa) expect(sons.rimam(d.modelo.figura, o.figura)).toBe(false)
      }
    }
  })

  it('a voz fala a sílaba e a palavra; as falas estão no catálogo', () => {
    const d = sons.criarDesafio(1, null)
    expect(sons.falas()).toContain(sons.instrucao(d).fala)
    expect(sons.falas()).toContain('Qual rima com gato?')
  })
})

describe('Monte a palavra', () => {
  it('as peças são as sílabas da palavra (com uma sobrando nos níveis 2 e 4)', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const d = monte.criarDesafio(nivel, null)
      const sobra = nivel === 2 || nivel === 4 ? 1 : 0
      expect(d.pecas).toHaveLength(d.palavra.silabas.length + sobra)
    }
  })

  it('aceita sílabas repetidas em qualquer ordem (BA-NA-NA)', () => {
    const d: monte.DesafioMonte = {
      palavra: { figura: 'banana', silabas: ['BA', 'NA', 'NA'] },
      pecas: [
        { id: 0, silaba: 'BA' },
        { id: 1, silaba: 'NA' },
        { id: 2, silaba: 'NA' },
      ],
    }
    expect(monte.ehAProxima(d, 0, { id: 1, silaba: 'NA' })).toBe(false)
    expect(monte.ehAProxima(d, 1, { id: 2, silaba: 'NA' })).toBe(true)
    expect(monte.instrucao(d).fala).toBe('Monte a palavra banana.')
  })
})

describe('Rotina do dia', () => {
  it('3 cenas nos níveis 1 e 2, 4 nos níveis 3 e 4; a primeira já vem no lugar nos níveis 1 e 3', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const d = rotina.criarDesafio(nivel, null)
      expect(d.cenas).toHaveLength(nivel <= 2 ? 3 : 4)
      expect(d.prontas).toBe(nivel === 1 || nivel === 3 ? 1 : 0)
      expect([...d.pecas].sort()).toEqual(d.cenas.map((_, i) => i).slice(d.prontas))
    }
  })
})

describe('Toque e segure', () => {
  it('o tempo para encher cresce com o nível', () => {
    expect(segure.progresso(500, 1)).toBe(0.5)
    expect(segure.progresso(1000, 2)).toBeCloseTo(2 / 3)
    expect(segure.progresso(5000, 3)).toBe(1)
    expect(segure.posicaoDoAlvo(1)).toEqual({ x: 0.5, y: 0.5 })
  })
})
