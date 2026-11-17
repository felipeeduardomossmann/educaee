import { describe, expect, it } from 'vitest'
import { TEMAS } from '../../lib/temas'
import {
  criarGrade,
  falas,
  GRADE_POR_NIVEL,
  instrucaoGrade,
  instrucaoSequencia,
  proximaAparicao,
} from './logica'

const figuras = TEMAS.animais.figuras

describe('Pegue só o...', () => {
  it('a grade tem o total certo, com o número certo de figuras pedidas', () => {
    for (const nivel of [1, 2, 3]) {
      const d = criarGrade(figuras, nivel, null)
      expect(d.itens).toHaveLength(GRADE_POR_NIVEL[nivel].total)
      expect(d.itens.filter((f) => f === d.alvo)).toHaveLength(GRADE_POR_NIVEL[nivel].alvos)
    }
  })

  it('no nível 4, nunca mais de 3 outras seguidas', () => {
    expect(proximaAparicao('gato', figuras, 3, () => 0.99)).toBe('gato')
    expect(proximaAparicao('gato', figuras, 0, () => 0.1)).toBe('gato')
    expect(proximaAparicao('gato', figuras, 0, () => 0.9)).not.toBe('gato')
  })

  it('fala com o artigo certo e as falas estão no catálogo', () => {
    expect(instrucaoGrade('gato')).toBe('Toque só no gato.')
    expect(instrucaoGrade('abelha')).toBe('Toque só na abelha.')
    expect(instrucaoSequencia('maca')).toBe('Toque só quando aparecer a maçã.')
    expect(falas()).toContain('Toque só no leão.')
  })
})
