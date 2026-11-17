import type { NomeFigura } from '../lib/figuras'
import {
  CARTOES_PADRAO,
  CARTOES_POR_TELA,
  POR_TELA_PADRAO,
  type CartoesPorTela,
  type CategoriaId,
} from './vocabulario'

/** Cartão criado pela professora (users/{uid}/cartoes), com pictograma e áudio próprios. */
export interface CartaoProprio {
  id: string
  palavra: string
  categoria: CategoriaId
  /** Pictograma (data URL WebP, 256 px). */
  imagem: string
  /** Fala gravada no servidor (data URL MP3) ou null (aí vale a voz do navegador). */
  audio: string | null
}

/** Um cartão pronto para a prancha (padrão ou próprio). */
export interface CartaoPrancha {
  /** "p:<figura>" ou "c:<id do cartão próprio>". */
  id: string
  palavra: string
  categoria: CategoriaId
  inicio?: boolean
  figura?: NomeFigura
  imagem?: string
  audio?: string | null
}

/** Configuração da prancha de um aluno (salva no aluno). */
export interface ConfigPrancha {
  /** Ids na ordem em que aparecem. */
  cartoes: string[]
  porTela: CartoesPorTela
}

export const MAXIMO_CARTOES_PRANCHA = 80

export const idProprio = (id: string) => `c:${id}`

export function todosOsCartoes(proprios: readonly CartaoProprio[]): CartaoPrancha[] {
  return [
    ...CARTOES_PADRAO,
    ...proprios.map((c) => ({
      id: idProprio(c.id),
      palavra: c.palavra,
      categoria: c.categoria,
      imagem: c.imagem,
      audio: c.audio,
    })),
  ]
}

/** Configuração inicial: todos os cartões padrão, na ordem do vocabulário. */
export function configPadrao(): ConfigPrancha {
  return { cartoes: CARTOES_PADRAO.map((c) => c.id), porTela: POR_TELA_PADRAO }
}

/** Cartões da prancha na ordem salva (ids que não existem mais são ignorados). */
export function montarPrancha(
  config: ConfigPrancha | null,
  proprios: readonly CartaoProprio[],
): CartaoPrancha[] {
  const porId = new Map(todosOsCartoes(proprios).map((c) => [c.id, c]))
  const ids = config?.cartoes ?? configPadrao().cartoes
  return ids.map((id) => porId.get(id)).filter((c): c is CartaoPrancha => c !== undefined)
}

/** Lê a configuração vinda do banco (com valores inválidos trocados pelo padrão). */
export function lerConfigPrancha(valor: unknown): ConfigPrancha | null {
  if (!valor || typeof valor !== 'object') return null
  const { cartoes, porTela } = valor as Record<string, unknown>
  if (!Array.isArray(cartoes)) return null
  return {
    cartoes: cartoes
      .filter((id): id is string => typeof id === 'string')
      .slice(0, MAXIMO_CARTOES_PRANCHA),
    porTela: CARTOES_POR_TELA.find((n) => n === porTela) ?? POR_TELA_PADRAO,
  }
}

/** Liga/desliga um cartão (ao ligar, entra no fim da sua categoria). */
export function alternarCartao(
  config: ConfigPrancha,
  id: string,
  todos: readonly CartaoPrancha[],
): ConfigPrancha {
  if (config.cartoes.includes(id)) {
    return { ...config, cartoes: config.cartoes.filter((c) => c !== id) }
  }
  if (config.cartoes.length >= MAXIMO_CARTOES_PRANCHA) return config
  const categoria = todos.find((c) => c.id === id)?.categoria
  const daCategoria = config.cartoes.filter(
    (c) => todos.find((t) => t.id === c)?.categoria === categoria,
  )
  const depoisDe = daCategoria.at(-1)
  const posicao = depoisDe ? config.cartoes.indexOf(depoisDe) + 1 : config.cartoes.length
  const cartoes = [...config.cartoes]
  cartoes.splice(posicao, 0, id)
  return { ...config, cartoes }
}

/** Move um cartão uma posição para trás (-1) ou para frente (+1), dentro da categoria. */
export function moverCartao(
  config: ConfigPrancha,
  id: string,
  delta: -1 | 1,
  todos: readonly CartaoPrancha[],
): ConfigPrancha {
  const categoria = todos.find((c) => c.id === id)?.categoria
  const daCategoria = config.cartoes.filter(
    (c) => todos.find((t) => t.id === c)?.categoria === categoria,
  )
  const i = daCategoria.indexOf(id)
  const vizinho = daCategoria[i + delta]
  if (i < 0 || !vizinho) return config
  const cartoes = [...config.cartoes]
  const a = cartoes.indexOf(id)
  const b = cartoes.indexOf(vizinho)
  ;[cartoes[a], cartoes[b]] = [cartoes[b] as string, cartoes[a] as string]
  return { ...config, cartoes }
}

/** Divide os cartões de uma categoria em telas de `porTela`. */
export function paginar<T>(itens: readonly T[], porTela: number): T[][] {
  const paginas: T[][] = []
  for (let i = 0; i < itens.length; i += porTela) paginas.push(itens.slice(i, i + porTela))
  return paginas.length > 0 ? paginas : [[]]
}

/** Texto da frase montada ("Eu quero água"). */
export function textoDaFrase(cartoes: readonly Pick<CartaoPrancha, 'palavra'>[]): string {
  return cartoes.map((c) => c.palavra).join(' ')
}
