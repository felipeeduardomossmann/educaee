import { describe, expect, it } from 'vitest'
import type { AtividadeId } from './atividade'
import type { Sessao } from './sessoes'
import { desempenho, diaLocal, montarTrilha } from './trilha'

const TODAS: AtividadeId[] = ['memoria', 'igual', 'alvo', 'letras', 'sequencia']
const HOJE = new Date(2026, 10, 2, 10, 0)

let n = 0
function rodada(atividadeId: AtividadeId, diasAtras: number, taxa: number): Sessao {
  const acertos = Math.round(taxa * 10)
  return {
    id: `s${n++}`,
    atividadeId,
    nivel: 1,
    acertos,
    erros: 10 - acertos,
    duracaoSeg: 60,
    concluidaEm: new Date(HOJE.getTime() - diasAtras * 24 * 60 * 60 * 1000),
  }
}

describe('montarTrilha', () => {
  it('sem histórico: 4 atividades diferentes, nos papéis certos, iguais o dia todo', () => {
    const trilha = montarTrilha(TODAS, [], HOJE)
    expect(trilha.map((e) => e.papel)).toEqual(['aquecimento', 'foco', 'foco', 'final'])
    expect(new Set(trilha.map((e) => e.atividadeId)).size).toBe(4)
    expect(montarTrilha(TODAS, [], new Date(2026, 10, 2, 18, 0))).toEqual(trilha)
  })

  it('com histórico: aquece no que vai bem, foca no pior e no menos praticado, fecha no mais jogado', () => {
    const sessoes = [
      // alvo: vai muito bem (aquecimento)
      rodada('alvo', 1, 1),
      rodada('alvo', 2, 0.95),
      // letras: vai mal (foco 1)
      rodada('letras', 1, 0.3),
      rodada('letras', 3, 0.4),
      // igual: a mais jogada, desempenho médio (final)
      ...[1, 2, 3, 4, 5, 6].map((d) => rodada('igual', d, 0.7)),
      // sequencia: jogada uma vez; memoria: nunca (foco 2 = menos praticada)
      rodada('sequencia', 4, 0.8),
    ]
    const trilha = montarTrilha(TODAS, sessoes, HOJE)
    expect(trilha).toEqual([
      { atividadeId: 'alvo', papel: 'aquecimento' },
      { atividadeId: 'letras', papel: 'foco' },
      { atividadeId: 'memoria', papel: 'foco' },
      { atividadeId: 'igual', papel: 'final' },
    ])
  })

  it('ignora as rodadas de hoje (a trilha não muda enquanto o aluno joga)', () => {
    const antes = [rodada('alvo', 1, 1), rodada('alvo', 2, 1), rodada('letras', 1, 0.2)]
    const trilha = montarTrilha(TODAS, antes, HOJE)
    const depois = [...antes, rodada('letras', 0, 1), rodada('letras', 0, 1)]
    expect(montarTrilha(TODAS, depois, HOJE)).toEqual(trilha)
  })

  it('com poucas atividades disponíveis, não repete', () => {
    const trilha = montarTrilha(['alvo', 'igual', 'letras'], [], HOJE)
    expect(trilha).toHaveLength(3)
    expect(new Set(trilha.map((e) => e.atividadeId)).size).toBe(3)
  })
})

describe('desempenho', () => {
  it('na memória, conta os erros em relação aos pares', () => {
    expect(desempenho({ atividadeId: 'memoria', nivel: 1, acertos: 2, erros: 0 })).toBe(1)
    expect(desempenho({ atividadeId: 'memoria', nivel: 1, acertos: 2, erros: 99 })).toBe(0)
    expect(desempenho({ atividadeId: 'igual', nivel: 1, acertos: 8, erros: 2 })).toBe(0.8)
  })

  it('diaLocal usa o dia do aparelho', () => {
    expect(diaLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
