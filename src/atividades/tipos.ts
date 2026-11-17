import type { ComponentType } from 'react'
import type { AtividadeId } from '../lib/atividade'
import type { NomeFigura } from '../lib/figuras'
import type { Perfil, Tema } from '../lib/perfil'

/** Rodada padrão: 8 jogadas (cada atividade pode usar outro valor). */
export const JOGADAS_POR_RODADA = 8

/** O que toda atividade recebe do motor (que conta acertos, erros e duração). */
export interface PropsAtividade {
  nivel: number
  perfil: Perfil
  tema: Tema
  /** true enquanto pausado: nada se mexe e os toques são ignorados. */
  pausado: boolean
  /** Mostra e fala a instrução; `fala` é usada quando a voz deve dizer outra coisa. */
  instruir: (texto: string, fala?: string) => void
  /** Fala algo (se a voz estiver ligada) sem mudar a instrução da tela (ex.: o nome da carta). */
  dizer: (fala: string) => void
  /** Avisa um acerto: o motor mostra o retorno positivo e toca o som. */
  acertou: () => void
  /** Avisa um erro: o motor mostra "Quase! Tente de novo" e toca o som. O aluno repete a jogada. */
  errou: () => void
  /** Avisa que a rodada terminou. */
  concluir: () => void
}

export interface DefinicaoAtividade {
  id: AtividadeId
  nome: string
  /** Habilidade trabalhada, usada para agrupar na tela de escolha. */
  habilidade: string
  descricao: string
  icone: NomeFigura
  /** A atividade depende de áudio (ex.: Letras). Com a voz desligada, o motor oferece ligar. */
  precisaVoz?: boolean
  /** Carrega o módulo da atividade sob demanda. Sem ele, a atividade aparece como "Em breve". */
  carregar?: () => Promise<{ default: ComponentType<PropsAtividade> }>
}
