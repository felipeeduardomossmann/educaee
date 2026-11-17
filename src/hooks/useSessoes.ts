import { useEffect, useState } from 'react'
import { observarSessoes, type Sessao } from '../lib/sessoes'

interface EstadoSessoes {
  sessoes: Sessao[]
  carregando: boolean
  erro: boolean
}

/** Todas as rodadas do aluno, da mais nova para a mais antiga, em tempo real. */
export function useSessoes(uid: string, alunoId: string): EstadoSessoes {
  const [estado, setEstado] = useState<EstadoSessoes>({
    sessoes: [],
    carregando: true,
    erro: false,
  })

  useEffect(() => {
    return observarSessoes(
      uid,
      alunoId,
      (sessoes) => setEstado({ sessoes, carregando: false, erro: false }),
      (falha) => {
        console.error(falha)
        setEstado((anterior) => ({ ...anterior, carregando: false, erro: true }))
      },
    )
  }, [uid, alunoId])

  return estado
}
