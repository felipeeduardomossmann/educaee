import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { NIVEIS_INICIAIS, type AtividadeId, type Niveis } from '../lib/atividade'
import { PERFIL_PADRAO, type Perfil } from '../lib/perfil'
import { ConvidadoContexto, type Convidado, type RodadaConvidado } from './convidado-contexto'

// Só as rodadas recentes importam para a sugestão de nível.
const RODADAS_GUARDADAS = 20

export default function ConvidadoProvider({ children }: { children: ReactNode }) {
  const [ativo, setAtivo] = useState(false)
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO)
  const [niveis, setNiveis] = useState<Niveis>(NIVEIS_INICIAIS)
  const [rodadas, setRodadas] = useState<RodadaConvidado[]>([])

  const ativar = useCallback(() => setAtivo(true), [])
  const mudarNivel = useCallback(
    (atividadeId: AtividadeId, nivel: number) =>
      setNiveis((atuais) => ({ ...atuais, [atividadeId]: nivel })),
    [],
  )
  const guardarRodada = useCallback(
    (rodada: RodadaConvidado) =>
      setRodadas((atuais) => [rodada, ...atuais].slice(0, RODADAS_GUARDADAS)),
    [],
  )

  const convidado = useMemo<Convidado>(
    () => ({
      ativo,
      perfil,
      niveis,
      rodadas,
      ativar,
      mudarPerfil: setPerfil,
      mudarNivel,
      guardarRodada,
    }),
    [ativo, perfil, niveis, rodadas, ativar, mudarNivel, guardarRodada],
  )

  return <ConvidadoContexto value={convidado}>{children}</ConvidadoContexto>
}
