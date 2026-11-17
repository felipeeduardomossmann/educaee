import { describe, expect, it } from 'vitest'
import { diasEntre, indicadoresAtividade, rodadasPorSemana } from './indicadores.js'

const r = (dia: number, nivel: number, taxa: number) => ({
  data: `2026-10-${String(dia).padStart(2, '0')}`,
  nivel,
  taxa,
})

describe('indicadoresAtividade', () => {
  it('sem rodadas devolve null', () => {
    expect(indicadoresAtividade([], 1)).toBeNull()
  })

  it('compara início e fim e mede a regularidade', () => {
    const ind = indicadoresAtividade(
      [r(1, 1, 50), r(2, 1, 55), r(3, 1, 60), r(4, 1, 75), r(5, 1, 80), r(6, 1, 85)],
      1,
    )
    expect(ind).toMatchObject({ taxaInicio: 55, taxaFim: 80, tendencia: 'subindo', dias: 6 })
    expect(ind?.consistencia).toBe('variavel')
  })

  it('pouca diferença é estável; queda forte é "caindo"', () => {
    expect(
      indicadoresAtividade([r(1, 2, 80), r(2, 2, 85), r(3, 2, 82), r(4, 2, 84)], 2)?.tendencia,
    ).toBe('estavel')
    expect(
      indicadoresAtividade([r(1, 2, 90), r(2, 2, 85), r(3, 2, 50), r(4, 2, 45)], 2)?.tendencia,
    ).toBe('caindo')
  })

  it('com menos de 4 rodadas não fala de tendência; com menos de 3, nem de regularidade', () => {
    const ind = indicadoresAtividade([r(1, 1, 80), r(1, 1, 60)], 1)
    expect(ind).toMatchObject({ tendencia: 'poucos-dados', consistencia: 'poucos-dados', dias: 1 })
    expect(ind?.sinal).toBe('poucos-dados')
  })

  it('conta subidas e descidas e olha o nível final', () => {
    const ind = indicadoresAtividade(
      [r(1, 1, 95), r(2, 2, 70), r(3, 3, 40), r(4, 2, 80), r(5, 2, 90)],
      2,
    )
    expect(ind).toMatchObject({ subidas: 2, descidas: 1, nivelInicio: 1, nivelFim: 2 })
    expect(ind).toMatchObject({ rodadasNoNivelFinal: 2, mediaNoNivelFinal: 85 })
  })

  it('sinal de nível: fácil, desafiador ou adequado', () => {
    expect(indicadoresAtividade([r(1, 2, 95), r(2, 2, 92), r(3, 2, 100)], 2)?.sinal).toBe(
      'pode-subir',
    )
    expect(indicadoresAtividade([r(1, 4, 95), r(2, 4, 92), r(3, 4, 100)], 4)?.sinal).toBe(
      'adequado',
    )
    expect(indicadoresAtividade([r(1, 3, 40), r(2, 3, 45), r(3, 3, 30)], 3)?.sinal).toBe(
      'desafiador',
    )
  })

  it('o total pode ser maior que a lista recebida', () => {
    expect(indicadoresAtividade([r(1, 1, 80)], 1, 75)?.rodadas).toBe(75)
  })
})

describe('frequência', () => {
  it('conta os dias inclusive e calcula rodadas por semana', () => {
    expect(diasEntre('2026-10-01', '2026-10-01')).toBe(1)
    expect(diasEntre('2026-10-01', '2026-10-31')).toBe(31)
    expect(rodadasPorSemana(30, 30)).toBe(7)
    expect(rodadasPorSemana(2, 1)).toBe(2)
  })
})
