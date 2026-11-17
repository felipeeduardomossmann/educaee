import { sortear, type Aleatorio } from '../../lib/aleatorio'

// Caminhos (pré-escrita): levar a figura até o fim arrastando o dedo pelo caminho.
// Os traçados ficam num quadro de 1000 × 600 (viewBox do SVG).

export const LARGURA_QUADRO = 1000
export const ALTURA_QUADRO = 600
/** Caminhos por rodada (traçar cansa mais que tocar). */
export const CAMINHOS_POR_RODADA = 5

export interface Caminho {
  id: string
  d: string
  /** Só no nível 4: a letra (como aparece) e como a voz fala o nome dela. */
  letra?: { texto: string; fala: string }
}

const NIVEL_1: Caminho[] = [
  { id: 'reto', d: 'M120 300 L880 300' },
  { id: 'sobe', d: 'M120 470 L880 130' },
  { id: 'desce', d: 'M120 130 L880 470' },
]

const NIVEL_2: Caminho[] = [
  { id: 'onda', d: 'M110 420 C 330 60, 560 560, 890 180' },
  { id: 'ponte', d: 'M110 470 C 280 40, 720 40, 890 470' },
  { id: 'vale', d: 'M110 130 C 300 580, 700 580, 890 130' },
]

const NIVEL_3: Caminho[] = [
  { id: 'zigue', d: 'M100 300 L260 140 L420 460 L580 140 L740 460 L900 300' },
  { id: 'serra', d: 'M100 460 L280 140 L460 460 L640 140 L820 460 L900 300' },
  { id: 'degraus', d: 'M100 480 L300 480 L300 320 L520 320 L520 160 L900 160' },
]

/** Letras de um traço só, centralizadas no quadro. */
const NIVEL_4: Caminho[] = [
  {
    id: 'O',
    d: 'M500 70 C 300 70 300 530 500 530 C 700 530 700 70 500 70',
    letra: { texto: 'O', fala: 'ó' },
  },
  {
    id: 'U',
    d: 'M370 80 L370 380 C 370 570 630 570 630 380 L630 80',
    letra: { texto: 'U', fala: 'u' },
  },
  {
    id: 'C',
    d: 'M650 150 C 570 50 340 60 340 300 C 340 540 570 550 650 450',
    letra: { texto: 'C', fala: 'cê' },
  },
  { id: 'L', d: 'M400 80 L400 520 L650 520', letra: { texto: 'L', fala: 'éle' } },
  { id: 'V', d: 'M350 80 L500 520 L650 80', letra: { texto: 'V', fala: 'vê' } },
  { id: 'M', d: 'M310 520 L310 80 L500 340 L690 80 L690 520', letra: { texto: 'M', fala: 'ême' } },
  { id: 'N', d: 'M350 520 L350 80 L650 520 L650 80', letra: { texto: 'N', fala: 'êne' } },
  { id: 'Z', d: 'M350 80 L650 80 L350 520 L650 520', letra: { texto: 'Z', fala: 'zê' } },
  {
    id: 'S',
    d: 'M640 140 C 560 50 360 70 380 200 C 400 320 620 290 630 420 C 640 560 420 560 350 480',
    letra: { texto: 'S', fala: 'ésse' },
  },
  { id: 'J', d: 'M600 80 L600 410 C 600 560 410 560 380 440', letra: { texto: 'J', fala: 'jota' } },
  { id: 'I', d: 'M500 80 L500 520', letra: { texto: 'I', fala: 'i' } },
]

export const CAMINHOS_POR_NIVEL: Record<number, readonly Caminho[]> = {
  1: NIVEL_1,
  2: NIVEL_2,
  3: NIVEL_3,
  4: NIVEL_4,
}

/** Largura do caminho (em unidades do quadro): mais largo nos níveis fáceis. */
const LARGURA_POR_NIVEL: Record<number, number> = { 1: 150, 2: 120, 3: 105, 4: 95 }

/** Tolerância do caminho, nunca menor que a área de toque. `escala` = px por unidade. */
export function tolerancia(nivel: number, areaToque: number, escala: number): number {
  const largura = LARGURA_POR_NIVEL[nivel] ?? 100
  const minima = escala > 0 ? (areaToque * 0.9) / escala : largura
  return Math.max(largura, minima) / 2
}

export function sortearCaminho(
  nivel: number,
  anterior: Caminho | null,
  aleatorio?: Aleatorio,
): Caminho {
  const lista = CAMINHOS_POR_NIVEL[nivel] ?? NIVEL_1
  const possiveis = lista.filter((c) => c.id !== anterior?.id)
  return (sortear(possiveis.length > 0 ? possiveis : lista, 1, aleatorio)[0] ?? lista[0]) as Caminho
}

export const INSTRUCAO_CAMINHO = 'Leve a figura até a casa. Arraste pelo caminho.'

export function instrucao(caminho: Caminho): { texto: string; fala: string } {
  if (caminho.letra) {
    return {
      texto: `Passe o dedo pela letra ${caminho.letra.texto}.`,
      fala: `Passe o dedo pela letra ${caminho.letra.fala}.`,
    }
  }
  return { texto: INSTRUCAO_CAMINHO, fala: INSTRUCAO_CAMINHO }
}

export function falas(): string[] {
  return [INSTRUCAO_CAMINHO, ...NIVEL_4.map((c) => instrucao(c).fala)]
}

export interface Ponto {
  x: number
  y: number
}

/** Ponto do caminho mais perto do dedo, só um pouco à frente; longe dele, não se move. */
export function avancar(
  pontos: readonly Ponto[],
  atual: number,
  dedo: Ponto,
  tolerancia: number,
  janela = 40,
): number {
  let melhor = atual
  let menor = Number.POSITIVE_INFINITY
  const fim = Math.min(pontos.length - 1, atual + janela)
  for (let i = atual; i <= fim; i++) {
    const p = pontos[i]
    const distancia = Math.hypot(p.x - dedo.x, p.y - dedo.y)
    if (distancia <= tolerancia * 1.5 && distancia < menor) {
      menor = distancia
      melhor = i
    }
  }
  return melhor
}
