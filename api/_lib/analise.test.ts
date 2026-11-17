import { describe, expect, it } from 'vitest'
import {
  agruparPorArea,
  comecoFim,
  corpoPedidoAnalise,
  dataBrasileira,
  descreverDados,
  extrairTexto,
  lerAnalise,
  MAXIMO_RODADAS,
  montarPrompt,
  removerContradicoes,
  validarDados,
} from './analise.js'

const valido = {
  periodo: '30',
  atividades: [
    {
      atividade: 'memoria',
      nivelAtual: 2,
      totalRodadas: 3,
      rodadas: [
        { data: '2026-10-01', nivel: 1, taxa: 50 },
        { data: '2026-10-05', nivel: 2, taxa: 60 },
        { data: '2026-10-09', nivel: 2, taxa: 75 },
      ],
    },
  ],
}

function dadosValidos() {
  const dados = validarDados(valido)
  if (!dados) throw new Error('os dados de exemplo deveriam ser válidos')
  return dados
}

describe('validarDados', () => {
  it('aceita o formato esperado', () => {
    expect(validarDados(valido)).toEqual(valido)
  })

  it('descarta campos a mais (como um nome), na raiz, na atividade e na rodada', () => {
    const comExtras = {
      ...valido,
      nome: 'Ana',
      atividades: [
        {
          ...valido.atividades[0],
          turma: '3º B',
          rodadas: valido.atividades[0].rodadas.map((r) => ({ ...r, aluno: 'Ana' })),
        },
      ],
    }
    const limpo = validarDados(comExtras)
    expect(limpo).toEqual(valido)
    expect(JSON.stringify(limpo)).not.toContain('Ana')
    expect(JSON.stringify(limpo)).not.toContain('3º B')
  })

  it('recusa período, atividade, nível, taxa e data fora do formato', () => {
    const mudar = (ajuste: (d: typeof valido) => unknown) =>
      validarDados(ajuste(structuredClone(valido)))
    expect(mudar((d) => ({ ...d, periodo: '90' }))).toBeNull()
    expect(
      mudar((d) => ({ ...d, atividades: [{ ...d.atividades[0], atividade: 'xadrez' }] })),
    ).toBeNull()
    expect(mudar((d) => ({ ...d, atividades: [{ ...d.atividades[0], nivelAtual: 5 }] }))).toBeNull()
    expect(
      mudar((d) => {
        d.atividades[0].rodadas[0].taxa = 101
        return d
      }),
    ).toBeNull()
    expect(
      mudar((d) => {
        d.atividades[0].rodadas[0].data = 'ontem'
        return d
      }),
    ).toBeNull()
    expect(mudar((d) => ({ ...d, atividades: [d.atividades[0], d.atividades[0]] }))).toBeNull()
    expect(validarDados(null)).toBeNull()
    expect(validarDados('texto')).toBeNull()
  })

  it(`limita a ${MAXIMO_RODADAS} rodadas por atividade`, () => {
    const muitas = Array.from({ length: MAXIMO_RODADAS + 1 }, () => ({
      data: '2026-10-01',
      nivel: 1,
      taxa: 50,
    }))
    expect(
      validarDados({
        periodo: 'tudo',
        atividades: [{ atividade: 'alvo', nivelAtual: 1, totalRodadas: 999, rodadas: muitas }],
      }),
    ).toBeNull()
  })
})

describe('texto para a IA', () => {
  it('manda indicadores por área, com datas brasileiras e sem a lista de rodadas', () => {
    expect(dataBrasileira('2026-10-05')).toBe('05/10/2026')
    const texto = descreverDados(dadosValidos())
    expect(texto).toContain('### Memória: 3 rodadas')
    expect(texto).toContain('Jogo da memória: 3 rodadas em 3 dias, nível atual 2')
    expect(texto).toContain('subiu de nível 1x (começou no 1, terminou no 2)')
    expect(texto).toContain('Primeira rodada em 01/10/2026')
    expect(texto).toContain('errar faz parte')
    expect(texto).toMatch(/Áreas sem nenhuma rodada no período: Atenção, Coordenação motora/)
    expect(texto).not.toContain('09/10/2026, nível 2, 75%')
  })

  it('o prompt pede interpretação, "o aluno", sem diagnóstico, sem comparar e sem inventar', () => {
    const prompt = montarPrompt(dadosValidos())
    expect(prompt).toContain('"o aluno"')
    expect(prompt).toMatch(/INTERPRETAR, não listar/)
    expect(prompt).toMatch(/no máximo 2 números/)
    expect(prompt).toMatch(/diagnóstico/)
    expect(prompt).toMatch(/não compare com outras crianças/i)
    expect(prompt).toMatch(/Não invente/)
    expect(prompt).toContain('Complete a sequência (padrões e sequências)')
  })

  it('pede JSON, sem guardar e com os filtros no mais restritivo', () => {
    const corpo = corpoPedidoAnalise(dadosValidos())
    expect(corpo.model).toBe('gemini-3.6-flash')
    expect(corpo.store).toBe(false)
    expect(corpo.response_format.mime_type).toBe('application/json')
    expect(corpo.response_format.schema.required).toContain('pontosFortes')
    expect(corpo.safety_settings.every((f) => f.threshold === 'block_low_and_above')).toBe(true)
  })
})

describe('resposta da IA', () => {
  const resposta = (texto: string) => ({
    steps: [{ type: 'model_output', content: [{ type: 'text', text: texto }] }],
  })

  it('lê o JSON, arruma espaços e corta as quantidades', () => {
    const texto = JSON.stringify({
      visaoGeral: '  O aluno   jogou bastante. ',
      pontosFortes: ['f1', 'f2', 'f3', 'f4'],
      pontosAtencao: [],
      evolucao: ['a'],
      sugestoes: ['s1', '', 's2', 's3', 's4'],
    })
    expect(lerAnalise(extrairTexto(resposta(texto)))).toEqual({
      visaoGeral: ['O aluno jogou bastante.'],
      fortes: ['f1', 'f2', 'f3'],
      atencao: [],
      evoluiu: ['a'],
      sugestoes: ['s1', 's2', 's3'],
    })
  })

  it('fora do formato, sem visão geral, sem sugestões ou sem texto devolve null', () => {
    const completo = {
      visaoGeral: 'Ok.',
      pontosFortes: [],
      pontosAtencao: [],
      evolucao: [],
      sugestoes: ['s'],
    }
    expect(lerAnalise(JSON.stringify(completo))).not.toBeNull()
    expect(lerAnalise('não é json')).toBeNull()
    expect(lerAnalise(JSON.stringify({ ...completo, visaoGeral: '' }))).toBeNull()
    expect(lerAnalise(JSON.stringify({ ...completo, sugestoes: [] }))).toBeNull()
    expect(lerAnalise(JSON.stringify({ visaoGeral: 'Só isso.' }))).toBeNull()
    expect(lerAnalise(extrairTexto({ steps: [] }))).toBeNull()
  })
})

describe('coerência da análise', () => {
  const ind = (rodadas: [number, number][]) => {
    const dados = validarDados({
      periodo: '30',
      atividades: [
        {
          atividade: 'igual',
          nivelAtual: rodadas[rodadas.length - 1][0],
          totalRodadas: rodadas.length,
          rodadas: rodadas.map(([nivel, taxa], i) => ({
            data: `2026-10-${String(i + 1).padStart(2, '0')}`,
            nivel,
            taxa,
          })),
        },
      ],
    })
    if (!dados) throw new Error('inválido')
    const item = agruparPorArea(dados).porArea.get('Atenção')?.[0]
    if (!item) throw new Error('sem indicadores')
    return item.ind
  }

  it('compara o começo e o fim: nível e acertos, ou diz que não dá', () => {
    expect(
      comecoFim(
        'igual',
        ind([
          [1, 50],
          [1, 60],
          [1, 80],
          [1, 90],
        ]),
      ),
    ).toBe('os acertos melhoraram')
    expect(
      comecoFim(
        'igual',
        ind([
          [1, 80],
          [1, 85],
          [2, 82],
          [2, 84],
        ]),
      ),
    ).toBe('subiu do nível 1 para o 2 e os acertos se mantiveram mesmo com o desafio maior')
    expect(
      comecoFim(
        'igual',
        ind([
          [1, 80],
          [1, 85],
        ]),
      ),
    ).toBe('sem dados suficientes para comparar o começo e o fim')
    expect(
      comecoFim(
        'igual',
        ind([
          [1, 80],
          [2, 85],
        ]),
      ),
    ).toBe('subiu do nível 1 para o 2')
  })

  it('separa áreas com dados suficientes, com poucos dados e sem prática', () => {
    const { comDados, poucosDados, semPratica } = agruparPorArea(dadosValidos())
    expect(comDados).toEqual([])
    expect(poucosDados).toEqual(['Memória'])
    expect(semPratica).toContain('Atenção')
    expect(descreverDados(dadosValidos())).toContain('### Memória: 3 rodadas (POUCOS DADOS')
  })

  it('tira dos pontos fortes o que cita uma área com poucos dados', () => {
    const analise = {
      visaoGeral: ['Ok.'],
      fortes: ['Foi bem no Jogo da memoria.', 'Mostrou boa memória.', 'Outra coisa.'],
      atencao: [],
      evoluiu: [],
      sugestoes: ['s'],
    }
    expect(removerContradicoes(analise, dadosValidos()).fortes).toEqual(['Outra coisa.'])
  })
})
