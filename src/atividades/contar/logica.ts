import { sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { nomeFalado } from '../../lib/nomes-falados'
import { TEMAS } from '../../lib/temas'

/** Até quanto conta em cada nível (o 4 compara dois grupos de até 8). */
export const MAXIMO_POR_NIVEL: Record<number, number> = { 1: 3, 2: 5, 3: 10, 4: 8 }
const OPCOES_POR_NIVEL: Record<number, number> = { 1: 3, 2: 3, 3: 4 }

export type DesafioContar =
  | { tipo: 'quantos'; figura: NomeFigura; quantidade: number; opcoes: number[] }
  | { tipo: 'mais'; figura: NomeFigura; grupos: [number, number] }

function numeroEntre(min: number, max: number, aleatorio: Aleatorio) {
  return min + Math.floor(aleatorio() * (max - min + 1))
}

export function criarDesafio(
  figuras: readonly NomeFigura[],
  nivel: number,
  anterior: DesafioContar | null,
  aleatorio: Aleatorio = Math.random,
): DesafioContar {
  const [figura] = sortear(
    figuras.filter((f) => f !== anterior?.figura),
    1,
    aleatorio,
  ) as [NomeFigura]
  const maximo = MAXIMO_POR_NIVEL[nivel] ?? 3

  if (nivel >= 4) {
    const a = numeroEntre(1, maximo, aleatorio)
    let b = numeroEntre(1, maximo, aleatorio)
    while (b === a) b = numeroEntre(1, maximo, aleatorio)
    return { tipo: 'mais', figura, grupos: [a, b] }
  }

  let quantidade = numeroEntre(1, maximo, aleatorio)
  if (anterior?.tipo === 'quantos' && quantidade === anterior.quantidade && maximo > 1) {
    quantidade = (quantidade % maximo) + 1
  }
  const numOpcoes = Math.min(OPCOES_POR_NIVEL[nivel] ?? 3, maximo)
  // Distrações perto da resposta (é o que pede atenção ao contar).
  const vizinhos = Array.from({ length: maximo }, (_, i) => i + 1)
    .filter((n) => n !== quantidade)
    .sort((x, y) => Math.abs(x - quantidade) - Math.abs(y - quantidade) || aleatorio() - 0.5)
  const opcoes = [quantidade, ...vizinhos.slice(0, numOpcoes - 1)].sort((x, y) => x - y)
  return { tipo: 'quantos', figura, quantidade, opcoes }
}

export function respostaCerta(desafio: DesafioContar): string {
  if (desafio.tipo === 'quantos') return String(desafio.quantidade)
  return desafio.grupos[0] > desafio.grupos[1] ? '0' : '1'
}

function perguntaQuantos(figura: NomeFigura) {
  const { plural, genero } = nomeFalado(figura)
  return `${genero === 'f' ? 'Quantas' : 'Quantos'} ${plural}? Toque no número.`
}

function perguntaMais(figura: NomeFigura) {
  return `Qual grupo tem mais ${nomeFalado(figura).plural}?`
}

export function instrucao(desafio: DesafioContar): { texto: string; fala: string } {
  const texto =
    desafio.tipo === 'quantos' ? perguntaQuantos(desafio.figura) : perguntaMais(desafio.figura)
  return { texto, fala: texto }
}

export function falas(): string[] {
  const figuras = [...new Set(Object.values(TEMAS).flatMap((t) => t.figuras))]
  return figuras.flatMap((f) => [perguntaQuantos(f), perguntaMais(f)])
}
