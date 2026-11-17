/** Formas do nível 1: cada cor tem sempre a mesma forma (não depende só de cor). */
export const FORMAS = {
  circulo: { cor: '#e5484d', rotulo: 'círculo vermelho' },
  quadrado: { cor: '#3e7bd6', rotulo: 'quadrado azul' },
  triangulo: { cor: '#f2c12e', rotulo: 'triângulo amarelo' },
  estrela: { cor: '#34a36b', rotulo: 'estrela verde' },
  coracao: { cor: '#8e5cd9', rotulo: 'coração roxo' },
} as const

export type NomeForma = keyof typeof FORMAS

export const NOMES_FORMAS = Object.keys(FORMAS) as NomeForma[]
