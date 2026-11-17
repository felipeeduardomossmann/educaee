import { describe, expect, it } from 'vitest'
import { corpoPedido, extrairImagem, limparTema, montarPrompt } from './desenho.js'

describe('limparTema', () => {
  it('junta espaços e tira aspas e quebras de linha', () => {
    expect(limparTema('  dinossauros \n na   "lua"  ')).toBe('dinossauros na lua')
  })

  it('recusa vazio, só espaços, não-texto e mais de 100 caracteres', () => {
    expect(limparTema('')).toBeNull()
    expect(limparTema('   ')).toBeNull()
    expect(limparTema(42)).toBeNull()
    expect(limparTema(undefined)).toBeNull()
    expect(limparTema('a'.repeat(100))).toHaveLength(100)
    expect(limparTema('a'.repeat(101))).toBeNull()
  })

  it('mantém acentos', () => {
    expect(limparTema('gatinhos na árvore de maçã')).toBe('gatinhos na árvore de maçã')
  })
})

describe('prompt e pedido', () => {
  it('o tema entra entre aspas num prompt fixo de página para colorir', () => {
    const prompt = montarPrompt('dinossauros na lua')
    expect(prompt).toContain('"dinossauros na lua"')
    expect(prompt).toMatch(/coloring page/i)
    expect(prompt).toMatch(/pure white background/i)
    expect(prompt).toMatch(/no text/i)
    expect(prompt).toMatch(/copyrighted/i)
  })

  it('pede retrato 3:4 em 1K, sem guardar, com todos os filtros no mais restritivo', () => {
    const corpo = corpoPedido('gatos')
    expect(corpo.model).toBe('gemini-nano-banana-2.1')
    expect(corpo.store).toBe(false)
    expect(corpo.generation_config.thinking_level).toBe('minimal')
    expect(corpo.response_format).toMatchObject({ aspect_ratio: '3:4', image_size: '1K' })
    expect(corpo.safety_settings).toHaveLength(5)
    for (const filtro of corpo.safety_settings) {
      expect(filtro.threshold).toBe('block_low_and_above')
    }
  })
})

describe('resposta do Gemini', () => {
  const comImagem = {
    steps: [
      { type: 'thought', signature: 'x' },
      { type: 'model_output', content: [{ type: 'image', mime_type: 'image/jpeg', data: 'QUJD' }] },
    ],
  }

  it('acha a imagem no passo model_output', () => {
    expect(extrairImagem(comImagem)).toEqual({ data: 'QUJD', mimeType: 'image/jpeg' })
  })

  it('sem imagem (só texto ou vazio) devolve null', () => {
    expect(
      extrairImagem({
        steps: [{ type: 'model_output', content: [{ type: 'text', text: 'não' }] }],
      }),
    ).toBeNull()
    expect(extrairImagem({})).toBeNull()
    expect(extrairImagem(null)).toBeNull()
  })
})
