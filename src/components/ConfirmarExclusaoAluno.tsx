import { useState } from 'react'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import type { Aluno } from '../lib/aluno'
import { excluirAluno } from '../lib/alunos'
import Botao from './Botao'
import Modal from './Modal'

interface ConfirmarExclusaoAlunoProps {
  /** Aluno a excluir; null deixa o modal fechado. */
  aluno: Pick<Aluno, 'id' | 'nome'> | null
  aoFechar: () => void
  aoExcluir?: () => void
}

/** Confirmação para excluir um aluno e todo o histórico dele. */
export default function ConfirmarExclusaoAluno({
  aluno,
  aoFechar,
  aoExcluir,
}: ConfirmarExclusaoAlunoProps) {
  const usuario = useUsuarioLogado()
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const fechar = () => {
    setErro(null)
    aoFechar()
  }

  const excluir = async () => {
    if (!aluno) return
    setErro(null)
    if (!navigator.onLine) {
      setErro('Sem conexão com a internet. Conecte-se para excluir o aluno.')
      return
    }
    setExcluindo(true)
    try {
      await excluirAluno(usuario.uid, aluno.id)
      setExcluindo(false)
      fechar()
      aoExcluir?.()
    } catch (falha) {
      console.error(falha)
      setErro('Não foi possível excluir. Verifique a internet e tente de novo.')
      setExcluindo(false)
    }
  }

  return (
    <Modal
      aberto={aluno !== null}
      titulo={`Excluir ${aluno?.nome ?? 'aluno'}?`}
      aoFechar={fechar}
      podeFechar={!excluindo}
      acoes={
        <>
          <Botao variante="secundario" onClick={fechar} disabled={excluindo}>
            Cancelar
          </Botao>
          <Botao
            className="bg-vermelho hover:bg-vermelho/90"
            onClick={() => void excluir()}
            disabled={excluindo}
          >
            {excluindo ? 'Excluindo…' : 'Excluir'}
          </Botao>
        </>
      }
    >
      <p>Isso apaga o aluno e todo o histórico. Não pode ser desfeito.</p>
      {erro && (
        <p role="alert" className="mt-3 font-semibold text-vermelho">
          {erro}
        </p>
      )}
    </Modal>
  )
}
