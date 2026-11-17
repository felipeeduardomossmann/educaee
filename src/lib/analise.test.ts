import { describe, expect, it } from 'vitest'
import { MAXIMO_RODADAS, montarDadosAnalise, personalizar, personalizarAnalise } from './analise'
import { NIVEIS_INICIAIS } from './atividade'
import type { Sessao } from './sessoes'

function sessao(
  n: number,
  atividadeId: Sessao['atividadeId'],
  extra: Partial<Sessao> = {},
): Sessao {
  return {
    id: `s${atividadeId}${n}`,
    atividadeId,
    nivel: 1,
    acertos: 8,
    erros: 2,
    duracaoSeg: 60,
    concluidaEm: new Date(2026, 9, 1 + n, 10, 0),
    ...extra,
  }
}

describe('montarDadosAnalise', () => {
  it('agrupa por atividade jogada, em ordem cronológica, só com números', () => {
    const sessoes = [sessao(3, 'memoria', { nivel: 2 }), sessao(1, 'memoria'), sessao(2, 'alvo')]
    const dados = montarDadosAnalise({ ...NIVEIS_INICIAIS, memoria: 2 }, sessoes, '30')
    expect(dados).toEqual({
      periodo: '30',
      atividades: [
        {
          atividade: 'memoria',
          nivelAtual: 2,
          totalRodadas: 2,
          rodadas: [
            { data: '2026-10-02', nivel: 1, taxa: 80 },
            { data: '2026-10-04', nivel: 2, taxa: 80 },
          ],
        },
        {
          atividade: 'alvo',
          nivelAtual: 1,
          totalRodadas: 1,
          rodadas: [{ data: '2026-10-03', nivel: 1, taxa: 80 }],
        },
      ],
    })
  })

  it(`manda só as ${MAXIMO_RODADAS} rodadas mais recentes, mas conta todas`, () => {
    const sessoes = Array.from({ length: MAXIMO_RODADAS + 5 }, (_, i) =>
      sessao(i, 'igual', { acertos: i % 2 === 0 ? 10 : 5, erros: 0 }),
    )
    const [igual] = montarDadosAnalise(NIVEIS_INICIAIS, sessoes, 'tudo').atividades
    expect(igual.totalRodadas).toBe(MAXIMO_RODADAS + 5)
    expect(igual.rodadas).toHaveLength(MAXIMO_RODADAS)
    expect(igual.rodadas.at(-1)?.data).toBe('2026-12-04')
  })

  it('não leva nada além de atividade, níveis, datas e taxas', () => {
    const dados = montarDadosAnalise(NIVEIS_INICIAIS, [sessao(1, 'letras')], '7')
    expect(Object.keys(dados).sort()).toEqual(['atividades', 'periodo'])
    expect(Object.keys(dados.atividades[0]).sort()).toEqual([
      'atividade',
      'nivelAtual',
      'rodadas',
      'totalRodadas',
    ])
    expect(Object.keys(dados.atividades[0].rodadas[0]).sort()).toEqual(['data', 'nivel', 'taxa'])
  })
})

describe('personalizar', () => {
  it('troca "o aluno" e as contrações pelo nome', () => {
    expect(personalizar('O aluno jogou bem. Parabéns ao aluno!', 'Ana')).toBe(
      'Ana jogou bem. Parabéns a Ana!',
    )
    expect(personalizar('O progresso do aluno é visível no aluno.', 'Ana')).toBe(
      'O progresso de Ana é visível em Ana.',
    )
    expect(personalizar('Feito pelo aluno. Do aluno, notamos...', 'Bia')).toBe(
      'Feito por Bia. De Bia, notamos...',
    )
  })

  it('não mexe em palavras parecidas', () => {
    expect(personalizar('Os alunos e o alunoX ficam iguais.', 'Ana')).toBe(
      'Os alunos e o alunoX ficam iguais.',
    )
  })

  it('personaliza todas as partes da análise', () => {
    expect(
      personalizarAnalise(
        {
          visaoGeral: ['O aluno'],
          fortes: ['pelo aluno'],
          evoluiu: ['o aluno'],
          atencao: [],
          sugestoes: ['ao aluno'],
        },
        'Léo',
      ),
    ).toEqual({
      visaoGeral: ['Léo'],
      fortes: ['por Léo'],
      evoluiu: ['Léo'],
      atencao: [],
      sugestoes: ['a Léo'],
    })
  })
})
