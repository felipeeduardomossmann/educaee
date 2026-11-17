import { describe, expect, it } from 'vitest'
import { TEMAS } from '../../lib/temas'
import { chaveItem, criarDesafio, OPCOES, PADROES_NIVEL_4, type ItemSequencia } from './logica'

function sequencia(semente = 13) {
  let x = semente
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

const figuras = TEMAS.espaco.figuras

/** Converte a sequência em letras (A, B, C…) pela ordem em que cada item aparece. */
function emLetras(itens: ItemSequencia[]): string {
  const vistos: string[] = []
  return itens
    .map((item) => {
      const chave = chaveItem(item)
      if (!vistos.includes(chave)) vistos.push(chave)
      return 'ABCD'[vistos.indexOf(chave)]
    })
    .join('')
}

describe('criarDesafio', () => {
  it('nível 1: AB AB A_ com formas coloridas', () => {
    const desafio = criarDesafio(1, figuras, sequencia())
    expect(emLetras(desafio.sequencia)).toBe('ABABA')
    expect(desafio.sequencia.every((item) => item.tipo === 'forma')).toBe(true)
    expect(emLetras([...desafio.sequencia, desafio.resposta])).toBe('ABABAB')
  })

  it('nível 2: AB AB A_ com figuras do tema', () => {
    const desafio = criarDesafio(2, figuras, sequencia())
    expect(emLetras(desafio.sequencia)).toBe('ABABA')
    expect(desafio.sequencia.every((item) => item.tipo === 'figura')).toBe(true)
  })

  it('nível 3: ABC ABC AB_', () => {
    const desafio = criarDesafio(3, figuras, sequencia())
    expect(emLetras([...desafio.sequencia, desafio.resposta])).toBe('ABCABCABC')
  })

  it('nível 4: AAB AAB AA_ e similares', () => {
    const aleatorio = sequencia()
    const vistos = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const desafio = criarDesafio(4, figuras, aleatorio)
      expect(PADROES_NIVEL_4).toContain(desafio.padrao)
      const completa = emLetras([...desafio.sequencia, desafio.resposta])
      expect(completa).toBe(emLetras(desafio.sequencia) + completa.at(-1))
      expect(completa).toBe(desafio.padrao.repeat(3))
      vistos.add(desafio.padrao)
    }
    expect(vistos.size).toBe(PADROES_NIVEL_4.length)
  })

  it.each([1, 2, 3, 4])('nível %i: 3 opções diferentes, uma é a resposta', (nivel) => {
    const aleatorio = sequencia(nivel)
    for (let i = 0; i < 20; i++) {
      const { opcoes, resposta } = criarDesafio(nivel, figuras, aleatorio)
      expect(opcoes).toHaveLength(OPCOES)
      expect(new Set(opcoes.map(chaveItem)).size).toBe(OPCOES)
      expect(opcoes.filter((o) => chaveItem(o) === chaveItem(resposta))).toHaveLength(1)
    }
  })
})
