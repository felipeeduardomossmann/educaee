import { useEffect, useState } from 'react'
import type { Aluno } from '../lib/aluno'
import { observarAluno } from '../lib/alunos'

export type EstadoAluno =
  | { situacao: 'carregando' }
  | { situacao: 'pronto'; aluno: Aluno }
  | { situacao: 'nao-encontrado' }
  | { situacao: 'erro' }

/** Um aluno, atualizado em tempo real. Com uid ou alunoId null, fica "não encontrado". */
export function useAluno(uid: string | null, alunoId: string | null): EstadoAluno {
  const [estado, setEstado] = useState<EstadoAluno>({ situacao: 'carregando' })
  const valido = uid !== null && alunoId !== null

  useEffect(() => {
    if (uid === null || alunoId === null) return
    return observarAluno(
      uid,
      alunoId,
      (aluno) => setEstado(aluno ? { situacao: 'pronto', aluno } : { situacao: 'nao-encontrado' }),
      (falha) => {
        console.error(falha)
        setEstado({ situacao: 'erro' })
      },
    )
  }, [uid, alunoId])

  return valido ? estado : { situacao: 'nao-encontrado' }
}
