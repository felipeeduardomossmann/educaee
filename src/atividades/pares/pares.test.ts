import { describe, expect, it } from 'vitest'
import { TEMAS } from '../../lib/temas'
import { tocarCarta } from '../memoria/logica'
import { criarJogoPares, falas, PARES_ASSOCIADOS, PARES_POR_NIVEL } from './logica'

describe('Pares que combinam', () => {
  it('cada nível tem o número certo de pares, cada par com a mesma chave', () => {
    for (const nivel of [1, 2, 3, 4]) {
      const { cartas } = criarJogoPares(nivel, TEMAS.animais.figuras)
      expect(cartas).toHaveLength(PARES_POR_NIVEL[nivel] * 2)
      const porChave = new Map<string, number>()
      for (const c of cartas)
        porChave.set(c.par ?? c.figura, (porChave.get(c.par ?? c.figura) ?? 0) + 1)
      expect([...porChave.values()].every((n) => n === 2)).toBe(true)
    }
  })

  it('figuras diferentes que combinam formam par (cachorro e osso)', () => {
    const estado = {
      cartas: [
        { figura: 'cachorro', par: 'cachorro', encontrada: false },
        { figura: 'macaco', par: 'macaco', encontrada: false },
        { figura: 'osso', par: 'cachorro', encontrada: false },
        { figura: 'banana', par: 'macaco', encontrada: false },
      ] as const,
      viradas: [],
      aguardandoDesvirar: false,
    }
    const primeira = tocarCarta({ ...estado, cartas: [...estado.cartas] }, 0).estado
    expect(tocarCarta(primeira, 2).evento).toBe('par')
    expect(tocarCarta(primeira, 3).evento).toBe('erro')
  })

  it('no nível 4, cada figura faz par com a sua sombra', () => {
    const { cartas } = criarJogoPares(4, TEMAS.frutas.figuras)
    expect(cartas.filter((c) => c.sombra)).toHaveLength(6)
  })

  it('as falas incluem os nomes das figuras dos pares', () => {
    expect(PARES_ASSOCIADOS.length).toBeGreaterThanOrEqual(6)
    expect(falas()).toContain('Cenoura.')
    expect(falas()).toContain('Sombra: maçã.')
  })
})
