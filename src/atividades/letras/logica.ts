import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import { CONSOANTES, PALAVRAS, SILABAS, VOGAIS, type ItemLetras } from './dados'

export const OPCOES = 3

export interface DesafioLetras {
  alvo: ItemLetras
  opcoes: ItemLetras[]
  /** Texto na tela (sem revelar a resposta) e o que a voz fala. */
  instrucao: { texto: string; fala: string }
}

function itensDoNivel(nivel: number): readonly ItemLetras[] {
  if (nivel <= 1) return VOGAIS
  if (nivel === 2) return CONSOANTES
  if (nivel === 3) return SILABAS
  return PALAVRAS
}

function instrucaoDoNivel(nivel: number, alvo: ItemLetras) {
  if (nivel <= 2) {
    return { texto: 'Toque na letra que você ouvir.', fala: `Toque na letra ${alvo.fala}.` }
  }
  if (nivel === 3) {
    return { texto: 'Toque na sílaba que você ouvir.', fala: `Toque na sílaba ${alvo.fala}.` }
  }
  return { texto: 'Toque no nome da figura.', fala: `${alvo.fala}. Toque na palavra ${alvo.fala}.` }
}

/** Distrações: uma com a mesma consoante e outra com a mesma vogal. */
function distracoesSilaba(alvo: ItemLetras, aleatorio?: Aleatorio): ItemLetras[] {
  const [consoante, vogal] = [alvo.texto[0], alvo.texto[1]]
  const mesmaConsoante = SILABAS.filter((s) => s.texto[0] === consoante && s !== alvo)
  const mesmaVogal = SILABAS.filter((s) => s.texto[1] === vogal && s !== alvo)
  return [...sortear(mesmaConsoante, 1, aleatorio), ...sortear(mesmaVogal, 1, aleatorio)]
}

export function criarDesafio(
  nivel: number,
  anterior: ItemLetras | null,
  aleatorio?: Aleatorio,
): DesafioLetras {
  const itens = itensDoNivel(nivel)
  // Não repete o alvo da jogada anterior.
  const [alvo] = sortear(
    itens.filter((item) => item.texto !== anterior?.texto),
    1,
    aleatorio,
  ) as [ItemLetras]
  const distracoes =
    nivel === 3
      ? distracoesSilaba(alvo, aleatorio)
      : sortear(
          itens.filter((item) => item !== alvo),
          OPCOES - 1,
          aleatorio,
        )
  return {
    alvo,
    opcoes: embaralhar([alvo, ...distracoes], aleatorio),
    instrucao: instrucaoDoNivel(nivel, alvo),
  }
}

/** Todas as falas desta atividade (para o catálogo de áudios gravados). */
export function falas(): string[] {
  return [1, 2, 3, 4].flatMap((nivel) =>
    itensDoNivel(nivel).map((item) => instrucaoDoNivel(nivel, item).fala),
  )
}
