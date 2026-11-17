import { describe, expect, it } from 'vitest'
import { CONSOANTES, PALAVRAS, SILABAS, VOGAIS, type ItemLetras } from './dados'
import { criarDesafio, OPCOES } from './logica'

function sequencia(semente = 5) {
  let x = semente
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

describe('dados', () => {
  it('têm o conteúdo da especificação', () => {
    expect(VOGAIS.map((v) => v.texto).join('')).toBe('AEIOU')
    expect(CONSOANTES.map((c) => c.texto).join('')).toBe('BCDFGLMNPRSTV')
    expect(PALAVRAS.map((p) => p.texto)).toEqual([
      'BOLA',
      'GATO',
      'PATO',
      'SAPO',
      'CASA',
      'DADO',
      'MALA',
      'VACA',
      'FOCA',
      'LUA',
      'SOL',
      'PÉ',
    ])
  })

  it('tudo em maiúsculas e toda palavra tem figura', () => {
    for (const item of [...VOGAIS, ...CONSOANTES, ...SILABAS, ...PALAVRAS]) {
      expect(item.texto).toBe(item.texto.toUpperCase())
    }
    expect(PALAVRAS.every((p) => p.figura)).toBe(true)
  })

  it('sílabas são consoante + vogal, com fala de vogal aberta', () => {
    expect(SILABAS).toContainEqual({ texto: 'BA', fala: 'bá' })
    expect(SILABAS).toContainEqual({ texto: 'MO', fala: 'mó' })
    expect(SILABAS.every((s) => s.texto.length === 2)).toBe(true)
  })
})

describe('criarDesafio', () => {
  it.each([1, 2, 3, 4])('nível %i: 3 opções diferentes, uma é o alvo', (nivel) => {
    const aleatorio = sequencia(nivel)
    for (let i = 0; i < 30; i++) {
      const { alvo, opcoes } = criarDesafio(nivel, null, aleatorio)
      expect(opcoes).toHaveLength(OPCOES)
      expect(new Set(opcoes.map((o) => o.texto)).size).toBe(OPCOES)
      expect(opcoes.filter((o) => o === alvo)).toHaveLength(1)
    }
  })

  it('a instrução na tela é a mesma em todo o nível (não revela a resposta); a fala, não', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const aleatorio = sequencia(nivel)
      const desafios = Array.from({ length: 20 }, () => criarDesafio(nivel, null, aleatorio))
      expect(new Set(desafios.map((d) => d.instrucao.texto)).size).toBe(1)
      for (const { alvo, instrucao } of desafios) expect(instrucao.fala).toContain(alvo.fala)
    }
  })

  it('sílabas: uma distração com a mesma consoante e outra com a mesma vogal', () => {
    const aleatorio = sequencia(9)
    for (let i = 0; i < 30; i++) {
      const { alvo, opcoes } = criarDesafio(3, null, aleatorio)
      const outras = opcoes.filter((o) => o !== alvo)
      expect(outras.some((o) => o.texto[0] === alvo.texto[0])).toBe(true)
      expect(outras.some((o) => o.texto[1] === alvo.texto[1])).toBe(true)
    }
  })

  it('nunca repete o alvo da jogada anterior', () => {
    const aleatorio = sequencia()
    let anterior: ItemLetras | null = null
    for (let i = 0; i < 40; i++) {
      const { alvo } = criarDesafio(1, anterior, aleatorio)
      expect(alvo.texto).not.toBe(anterior?.texto)
      anterior = alvo
    }
  })
})
