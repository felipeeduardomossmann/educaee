import { useEffect, useState } from 'react'
import { ordenarAlunos, type Aluno } from '../lib/aluno'
import { observarAlunos } from '../lib/alunos'

interface EstadoAlunos {
  alunos: Aluno[]
  carregando: boolean
  erro: boolean
}

/** Lista de alunos do usuário, em ordem alfabética, atualizada em tempo real. */
export function useAlunos(uid: string): EstadoAlunos {
  const [estado, setEstado] = useState<EstadoAlunos>({ alunos: [], carregando: true, erro: false })

  useEffect(() => {
    return observarAlunos(
      uid,
      (alunos) => setEstado({ alunos: ordenarAlunos(alunos), carregando: false, erro: false }),
      (falha) => {
        console.error(falha)
        setEstado((anterior) => ({ ...anterior, carregando: false, erro: true }))
      },
    )
  }, [uid])

  return estado
}
