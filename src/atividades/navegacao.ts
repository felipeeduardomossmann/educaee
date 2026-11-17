import type { NavigateFunction } from 'react-router'
import type { AtividadeId } from '../lib/atividade'

/** Quem joga e em que nível (vai no estado da navegação, não na URL). */
export type Jogador = { tipo: 'aluno'; alunoId: string } | { tipo: 'convidado' }

export interface EstadoAtividade {
  jogador: Jogador
  nivel: number
  /** Quando a atividade é uma etapa da trilha do dia (só com aluno). */
  trilha?: { etapa: number }
}

export function irParaAtividade(
  navigate: NavigateFunction,
  atividadeId: AtividadeId,
  estado: EstadoAtividade,
) {
  void navigate(`/atividade/${atividadeId}`, { state: estado })
}

/** Lê o estado da navegação com segurança (ele pode vir de qualquer lugar do histórico). */
export function lerEstadoAtividade(estado: unknown): EstadoAtividade | null {
  if (typeof estado !== 'object' || estado === null) return null
  const { jogador, nivel, trilha } = estado as Partial<EstadoAtividade>
  if (typeof nivel !== 'number' || !jogador) return null
  if (jogador.tipo === 'convidado') return { jogador, nivel }
  if (jogador.tipo === 'aluno' && typeof jogador.alunoId === 'string') {
    const etapa = trilha?.etapa
    return typeof etapa === 'number' && Number.isInteger(etapa) && etapa >= 0
      ? { jogador, nivel, trilha: { etapa } }
      : { jogador, nivel }
  }
  return null
}

/** Para onde voltar ao sair da atividade (na trilha, volta para a trilha). */
export function telaDeEscolha(jogador: Jogador, naTrilha = false): string {
  if (jogador.tipo !== 'aluno') return '/convidado'
  return naTrilha ? `/aluno/${jogador.alunoId}/trilha` : `/aluno/${jogador.alunoId}/atividades`
}
