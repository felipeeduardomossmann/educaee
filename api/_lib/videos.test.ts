import { describe, expect, it } from 'vitest'
import {
  corpoPedidoFiltro,
  decodificarEntidades,
  diaPacifico,
  duracaoEmSegundos,
  filtrarDetalhes,
  lerAprovados,
  limparTermo,
  normalizarTermo,
  paraVideo,
  termoDeBusca,
} from './videos.js'

function item(id: string, ajustes: Record<string, unknown> = {}) {
  return {
    id,
    snippet: {
      title: 'Música dos &quot;Dinos&quot; &amp; amigos',
      channelTitle: 'Canal',
      description: 'Uma   descrição\nlonga',
      thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } },
    },
    contentDetails: { duration: 'PT3M20S' },
    status: { madeForKids: true, embeddable: true, privacyStatus: 'public' },
    ...ajustes,
  }
}

describe('termo', () => {
  it('limpa, limita a 60 caracteres e normaliza para o cache', () => {
    expect(limparTermo('  "Dinossauros"   na lua ')).toBe('Dinossauros na lua')
    expect(limparTermo('a'.repeat(61))).toBeNull()
    expect(limparTermo('   ')).toBeNull()
    expect(normalizarTermo('Dinossauros!  Água')).toBe('dinossauros agua')
  })

  it('acrescenta "para crianças", a não ser que já tenha', () => {
    expect(termoDeBusca('dinossauros')).toBe('dinossauros para crianças')
    expect(termoDeBusca('música infantil')).toBe('música infantil')
    expect(termoDeBusca('jogos para criancas')).toBe('jogos para criancas')
  })

  it('o dia da cota do YouTube vira à meia-noite do Pacífico', () => {
    expect(diaPacifico(new Date('2026-11-02T07:59:00Z'))).toBe('2026-11-01')
    expect(diaPacifico(new Date('2026-11-02T08:00:00Z'))).toBe('2026-11-02')
  })
})

describe('detalhes dos vídeos', () => {
  it('converte durações ISO 8601', () => {
    expect(duracaoEmSegundos('PT3M20S')).toBe(200)
    expect(duracaoEmSegundos('PT1H2M3S')).toBe(3723)
    expect(duracaoEmSegundos('PT45S')).toBe(45)
    expect(duracaoEmSegundos('P0D')).toBe(0)
    expect(duracaoEmSegundos('lixo')).toBe(0)
  })

  it('decodifica entidades HTML dos títulos', () => {
    expect(decodificarEntidades('A &amp; B &#39;c&#39; &quot;d&quot; &#233;')).toBe(
      `A & B 'c' "d" é`,
    )
  })

  it('só deixa vídeos feitos para crianças, incorporáveis, públicos e de até 20 min', () => {
    const itens = [
      item('aaaaaaaaaaa'),
      item('bbbbbbbbbbb', {
        status: { madeForKids: false, embeddable: true, privacyStatus: 'public' },
      }),
      item('ccccccccccc', {
        status: { madeForKids: true, embeddable: false, privacyStatus: 'public' },
      }),
      item('ddddddddddd', { contentDetails: { duration: 'PT20M1S' } }),
      item('eeeeeeeeeee', { contentDetails: { duration: 'PT20M' } }),
      item('fffffffffff', {
        status: { madeForKids: true, embeddable: true, privacyStatus: 'unlisted' },
      }),
      item('id-invalido'),
    ]
    const ordem = ['eeeeeeeeeee', 'aaaaaaaaaaa', 'bbbbbbbbbbb']
    const resultado = filtrarDetalhes(itens, ordem)
    // Mantém a ordem da busca (relevância) e só os aprovados.
    expect(resultado.map((v) => v.id)).toEqual(['eeeeeeeeeee', 'aaaaaaaaaaa'])
    expect(resultado[1]).toMatchObject({
      titulo: 'Música dos "Dinos" & amigos',
      duracaoSeg: 200,
      descricao: 'Uma descrição longa',
    })
    expect(Object.keys(paraVideo(resultado[1])).sort()).toEqual([
      'canal',
      'duracaoSeg',
      'id',
      'miniatura',
      'titulo',
    ])
    expect(filtrarDetalhes(null, ordem)).toEqual([])
  })
})

describe('filtro com IA', () => {
  const candidatos = filtrarDetalhes(
    [item('aaaaaaaaaaa'), item('bbbbbbbbbbb'), item('ccccccccccc')],
    ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc'],
  )

  it('pede JSON com temperatura 0, raciocínio mínimo e os filtros no mais restritivo', () => {
    const corpo = corpoPedidoFiltro('dinossauros', candidatos)
    expect(corpo.response_format.mime_type).toBe('application/json')
    expect(corpo.generation_config).toEqual({ thinking_level: 'minimal', temperature: 0 })
    expect(corpo.store).toBe(false)
    expect(corpo.input[0].text).toContain('"dinossauros"')
    expect(corpo.input[0].text).toContain('id: bbbbbbbbbbb')
  })

  it('só aceita ids que estavam na lista, na ordem original', () => {
    const texto = JSON.stringify({ aprovados: ['ccccccccccc', 'zzzzzzzzzzz', 'aaaaaaaaaaa'] })
    expect(lerAprovados(texto, candidatos)?.map((c) => c.id)).toEqual([
      'aaaaaaaaaaa',
      'ccccccccccc',
    ])
  })

  it('resposta inválida devolve null (aí valem os filtros do YouTube)', () => {
    expect(lerAprovados('não é json', candidatos)).toBeNull()
    expect(lerAprovados(JSON.stringify({ outros: [] }), candidatos)).toBeNull()
    expect(lerAprovados(null, candidatos)).toBeNull()
    expect(lerAprovados(JSON.stringify({ aprovados: [] }), candidatos)).toEqual([])
  })
})
