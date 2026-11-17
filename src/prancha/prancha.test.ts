import { describe, expect, it } from 'vitest'
import {
  alternarCartao,
  configPadrao,
  lerConfigPrancha,
  montarPrancha,
  moverCartao,
  paginar,
  textoDaFrase,
  todosOsCartoes,
  type CartaoProprio,
} from './prancha'
import { CARTOES_PADRAO, falaDoCartao, falas } from './vocabulario'

const proprio: CartaoProprio = {
  id: 'x1',
  palavra: 'bicicleta azul',
  categoria: 'quero',
  imagem: 'data:image/webp;base64,AAA',
  audio: null,
}

describe('prancha', () => {
  it('sem configuração, mostra todos os cartões padrão na ordem', () => {
    expect(montarPrancha(null, []).map((c) => c.id)).toEqual(CARTOES_PADRAO.map((c) => c.id))
  })

  it('segue a ordem da configuração e ignora cartões que não existem mais', () => {
    const config = { cartoes: ['p:sim', 'c:x1', 'c:apagado', 'p:agua'], porTela: 4 as const }
    expect(montarPrancha(config, [proprio]).map((c) => c.id)).toEqual(['p:sim', 'c:x1', 'p:agua'])
  })

  it('ligar um cartão o coloca no fim da categoria; desligar o tira', () => {
    const todos = todosOsCartoes([proprio])
    const base = { cartoes: ['p:eu-quero', 'p:agua', 'p:sim'], porTela: 6 as const }
    const ligado = alternarCartao(base, 'c:x1', todos)
    expect(ligado.cartoes).toEqual(['p:eu-quero', 'p:agua', 'c:x1', 'p:sim'])
    expect(alternarCartao(ligado, 'c:x1', todos).cartoes).toEqual(base.cartoes)
  })

  it('move dentro da categoria (sem pular para outra)', () => {
    const todos = todosOsCartoes([])
    const base = { cartoes: ['p:eu-quero', 'p:agua', 'p:sim', 'p:nao'], porTela: 6 as const }
    expect(moverCartao(base, 'p:agua', -1, todos).cartoes).toEqual([
      'p:agua',
      'p:eu-quero',
      'p:sim',
      'p:nao',
    ])
    expect(moverCartao(base, 'p:agua', 1, todos).cartoes).toEqual(base.cartoes)
  })

  it('lê a configuração do banco com segurança', () => {
    expect(lerConfigPrancha({ cartoes: ['p:sim', 3], porTela: 5 })).toEqual({
      cartoes: ['p:sim'],
      porTela: 6,
    })
    expect(lerConfigPrancha(null)).toBeNull()
    expect(configPadrao().cartoes).toHaveLength(CARTOES_PADRAO.length)
  })

  it('pagina e monta a frase', () => {
    expect(paginar([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(paginar([], 4)).toEqual([[]])
    expect(textoDaFrase([{ palavra: 'Eu quero' }, { palavra: 'água' }])).toBe('Eu quero água')
  })

  it('as falas do vocabulário padrão estão no catálogo', () => {
    expect(falaDoCartao('água')).toBe('Água.')
    expect(falas()).toContain('Eu quero.')
    expect(falas()).toHaveLength(CARTOES_PADRAO.length)
  })
})
