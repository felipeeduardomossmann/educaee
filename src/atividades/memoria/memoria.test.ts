import { describe, expect, it } from 'vitest'
import { embaralhar, sortear } from '../../lib/aleatorio'
import { TEMAS } from '../../lib/temas'
import { calcularGrade } from '../grade'
import { criarJogo, desvirar, PARES_POR_NIVEL, tocarCarta, type EstadoMemoria } from './logica'

// Gerador previsível (sempre a mesma sequência).
function sequencia(semente = 1) {
  let x = semente
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

/** Jogo pequeno e conhecido: [gato, cachorro, gato, cachorro]. */
function jogoConhecido(): EstadoMemoria {
  return {
    cartas: (['gato', 'cachorro', 'gato', 'cachorro'] as const).map((figura) => ({
      figura,
      encontrada: false,
    })),
    viradas: [],
    aguardandoDesvirar: false,
  }
}

describe('embaralhar e sortear', () => {
  it('embaralhar mantém os mesmos itens', () => {
    expect(embaralhar([1, 2, 3, 4, 5], sequencia()).sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('sortear devolve itens diferentes', () => {
    const sorteados = sortear([1, 2, 3, 4, 5, 6], 4, sequencia())
    expect(new Set(sorteados).size).toBe(4)
  })

  it('sortear recusa quantidade maior que a lista', () => {
    expect(() => sortear([1, 2], 3)).toThrow()
  })
})

describe('criarJogo', () => {
  it.each([1, 2, 3, 4])('nível %i tem cada figura exatamente duas vezes', (nivel) => {
    const pares = PARES_POR_NIVEL[nivel] ?? 0
    const { cartas } = criarJogo(TEMAS.animais.figuras, pares, sequencia(nivel))
    expect(cartas).toHaveLength(pares * 2)
    const contagem = new Map<string, number>()
    for (const carta of cartas) contagem.set(carta.figura, (contagem.get(carta.figura) ?? 0) + 1)
    expect([...contagem.values()].every((n) => n === 2)).toBe(true)
    expect(contagem.size).toBe(pares)
  })
})

describe('tocarCarta', () => {
  it('vira a primeira carta', () => {
    const { estado, evento } = tocarCarta(jogoConhecido(), 0)
    expect(evento).toBe('virou')
    expect(estado.viradas).toEqual([0])
  })

  it('par igual fica encontrado', () => {
    const { estado, evento } = tocarCarta(tocarCarta(jogoConhecido(), 0).estado, 2)
    expect(evento).toBe('par')
    expect(estado.cartas[0]?.encontrada && estado.cartas[2]?.encontrada).toBe(true)
    expect(estado.viradas).toEqual([])
  })

  it('par diferente é erro e espera para desvirar', () => {
    const { estado, evento } = tocarCarta(tocarCarta(jogoConhecido(), 0).estado, 1)
    expect(evento).toBe('erro')
    expect(estado.aguardandoDesvirar).toBe(true)
    // Enquanto espera, novos toques são ignorados.
    expect(tocarCarta(estado, 3).evento).toBe('nada')
    expect(desvirar(estado)).toMatchObject({ viradas: [], aguardandoDesvirar: false })
  })

  it('ignora tocar de novo na mesma carta ou numa já encontrada', () => {
    const umaVirada = tocarCarta(jogoConhecido(), 0).estado
    expect(tocarCarta(umaVirada, 0).evento).toBe('nada')
    const comPar = tocarCarta(umaVirada, 2).estado
    expect(tocarCarta(comPar, 2).evento).toBe('nada')
  })

  it('o último par termina o jogo', () => {
    let estado = jogoConhecido()
    for (const indice of [0, 2, 1]) estado = tocarCarta(estado, indice).estado
    expect(tocarCarta(estado, 3).evento).toBe('fim')
  })
})

describe('calcularGrade', () => {
  const base = { espaco: 12, minimo: 88, maximo: 200 }

  it('escolhe as colunas que deixam as cartas maiores', () => {
    // Tela larga e baixa: 6 x 3 (lado 165) ganha de 8 x 2 (139) e de 4 x 4 (121).
    expect(calcularGrade({ ...base, quantidade: 16, largura: 1200, altura: 520 })).toEqual({
      colunas: 6,
      linhas: 3,
      lado: 165,
    })
    // Notebook 1366 x 768: 8 x 2 (lado 156) quase empata com 6 x 3 (158) e não deixa buracos.
    expect(calcularGrade({ ...base, quantidade: 16, largura: 1334, altura: 498 })).toEqual({
      colunas: 8,
      linhas: 2,
      lado: 156,
    })
    // Tela quadrada: 4 x 4.
    expect(calcularGrade({ ...base, quantidade: 16, largura: 700, altura: 700 })).toMatchObject({
      colunas: 4,
      linhas: 4,
    })
  })

  it('4 cartas numa tela larga ficam lado a lado', () => {
    expect(calcularGrade({ ...base, quantidade: 4, largura: 1200, altura: 300 }).colunas).toBe(4)
  })

  it('nunca fica abaixo da área de toque', () => {
    expect(calcularGrade({ ...base, quantidade: 16, largura: 320, altura: 300 }).lado).toBe(88)
  })

  it('em tela estreita, nunca passa da largura (rola só na vertical)', () => {
    // 360 px de largura: 4 colunas de 88 px não cabem em 328 px; 3 cabem.
    const grade = calcularGrade({ ...base, quantidade: 16, largura: 328, altura: 400 })
    expect(grade).toEqual({ colunas: 3, linhas: 6, lado: 88 })
    expect(grade.colunas * grade.lado + (grade.colunas - 1) * base.espaco).toBeLessThanOrEqual(328)
  })
})
