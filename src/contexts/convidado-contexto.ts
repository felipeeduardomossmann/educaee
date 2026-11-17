import { createContext, useContext } from 'react'
import type { AtividadeId, Niveis } from '../lib/atividade'
import type { Perfil } from '../lib/perfil'
import type { RodadaAvaliada } from '../lib/sugestao'

export interface RodadaConvidado extends RodadaAvaliada {
  atividadeId: AtividadeId
  nivel: number
}

/** Estado do modo convidado, só em memória. */
export interface Convidado {
  /** true depois que a tela /convidado foi aberta nesta visita. */
  ativo: boolean
  perfil: Perfil
  niveis: Niveis
  /** Rodadas desta visita, da mais nova para a mais antiga (para a sugestão de nível). */
  rodadas: readonly RodadaConvidado[]
  ativar: () => void
  mudarPerfil: (perfil: Perfil) => void
  mudarNivel: (atividadeId: AtividadeId, nivel: number) => void
  guardarRodada: (rodada: RodadaConvidado) => void
}

export const ConvidadoContexto = createContext<Convidado | null>(null)

export function useConvidado(): Convidado {
  const convidado = useContext(ConvidadoContexto)
  if (!convidado) throw new Error('useConvidado precisa estar dentro de <ConvidadoProvider>')
  return convidado
}
