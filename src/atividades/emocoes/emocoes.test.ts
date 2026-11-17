import { describe, expect, it } from 'vitest'
import { criarDesafio, falas, instrucao, OPCOES_POR_NIVEL, SITUACOES } from './logica'

describe('Emoções', () => {
  it('tem a quantidade certa de opções, sem repetir, com a resposta entre elas', () => {
    for (const nivel of [1, 2, 3, 4]) {
      for (let i = 0; i < 30; i++) {
        const d = criarDesafio(nivel, null)
        expect(d.opcoes).toHaveLength(OPCOES_POR_NIVEL[nivel])
        expect(new Set(d.opcoes).size).toBe(d.opcoes.length)
        expect(d.opcoes).toContain(d.alvo)
        expect(d.situacao !== null).toBe(nivel === 4)
      }
    }
  })

  it('no nível 4, a resposta é a emoção da situação, e a voz faz a pergunta', () => {
    const d = criarDesafio(4, null)
    expect(SITUACOES.find((s) => s.texto === d.situacao)?.emocao).toBe(d.alvo)
    expect(instrucao(d).fala).toContain('Como a criança se sente?')
  })

  it('não repete o alvo seguido e todas as falas estão no catálogo', () => {
    const primeiro = criarDesafio(1, null)
    expect(criarDesafio(1, primeiro).alvo).not.toBe(primeiro.alvo)
    for (const nivel of [1, 4]) expect(falas()).toContain(instrucao(criarDesafio(nivel, null)).fala)
  })
})
