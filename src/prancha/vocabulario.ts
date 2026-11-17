import type { NomeFigura } from '../lib/figuras'

// Prancha de comunicação (CAA): vocabulário padrão, com áudio gravado (catálogo de falas).

export type CategoriaId = 'quero' | 'sinto' | 'respostas' | 'pessoas'

export interface Categoria {
  id: CategoriaId
  nome: string
  /** Fundo da aba e dos cartões (pastel do tema; o texto fica em tinta). */
  fundo: string
  /** Cor da borda/destaque. */
  borda: string
}

export const CATEGORIAS: readonly Categoria[] = [
  { id: 'quero', nome: 'Eu quero', fundo: 'bg-ceu', borda: 'border-azul' },
  { id: 'sinto', nome: 'Eu sinto', fundo: 'bg-rosa', borda: 'border-coral' },
  { id: 'respostas', nome: 'Respostas', fundo: 'bg-menta', borda: 'border-verde' },
  { id: 'pessoas', nome: 'Pessoas e lugares', fundo: 'bg-sol', borda: 'border-tinta-suave' },
]

/** Cores das categorias no PDF (RGB), iguais às do site. */
export const CORES_PDF: Record<CategoriaId, [number, number, number]> = {
  quero: [0xdc, 0xeb, 0xfb],
  sinto: [0xfc, 0xe1, 0xec],
  respostas: [0xd5, 0xf3, 0xe4],
  pessoas: [0xff, 0xf0, 0xbf],
}

export interface CartaoPadrao {
  /** "p:agua" (os cartões próprios da professora são "c:<id>"). */
  id: string
  palavra: string
  figura: NomeFigura
  categoria: CategoriaId
  /** Começo de frase ("Eu quero", "Eu sinto"). */
  inicio?: boolean
}

const cartao = (
  categoria: CategoriaId,
  figura: NomeFigura,
  palavra: string,
  inicio = false,
): CartaoPadrao => ({
  id: `p:${figura}`,
  palavra,
  figura,
  categoria,
  ...(inicio ? { inicio } : {}),
})

export const CARTOES_PADRAO: readonly CartaoPadrao[] = [
  cartao('quero', 'eu-quero', 'Eu quero', true),
  cartao('quero', 'agua', 'água'),
  cartao('quero', 'prato', 'comer'),
  cartao('quero', 'banheiro', 'banheiro'),
  cartao('quero', 'brincar', 'brincar'),
  cartao('quero', 'descansar', 'descansar'),
  cartao('quero', 'mao', 'ajuda'),
  cartao('quero', 'abraco', 'abraço'),
  cartao('quero', 'porta', 'ir embora'),
  cartao('sinto', 'eu-sinto', 'Eu sinto', true),
  cartao('sinto', 'rosto-feliz', 'feliz'),
  cartao('sinto', 'rosto-triste', 'triste'),
  cartao('sinto', 'rosto-bravo', 'bravo'),
  cartao('sinto', 'rosto-com-medo', 'com medo'),
  cartao('sinto', 'com-dor', 'com dor'),
  cartao('sinto', 'cansado', 'cansado'),
  cartao('respostas', 'sim', 'sim'),
  cartao('respostas', 'nao', 'não'),
  cartao('respostas', 'nao-sei', 'não sei'),
  cartao('respostas', 'de-novo', 'de novo'),
  cartao('respostas', 'acabou', 'acabou'),
  cartao('respostas', 'ampulheta', 'espera'),
  cartao('pessoas', 'professora', 'professora'),
  cartao('pessoas', 'mae', 'mãe'),
  cartao('pessoas', 'pai', 'pai'),
  cartao('pessoas', 'colega', 'colega'),
  cartao('pessoas', 'casa', 'casa'),
  cartao('pessoas', 'escola', 'escola'),
  cartao('pessoas', 'parque', 'parque'),
]

export const IDS_PADRAO = CARTOES_PADRAO.map((c) => c.id)
export const CARTOES_POR_TELA = [2, 4, 6, 9] as const
export type CartoesPorTela = (typeof CARTOES_POR_TELA)[number]
export const POR_TELA_PADRAO: CartoesPorTela = 6
export const TAMANHO_MAXIMO_PALAVRA = 30

/** O que a voz fala ao tocar no cartão (com a primeira letra maiúscula e ponto). */
export function falaDoCartao(palavra: string): string {
  const limpa = palavra.trim()
  return `${limpa.charAt(0).toUpperCase()}${limpa.slice(1)}.`
}

export function falas(): string[] {
  return CARTOES_PADRAO.map((c) => falaDoCartao(c.palavra))
}
