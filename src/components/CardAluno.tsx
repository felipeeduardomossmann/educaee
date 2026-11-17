import { useState } from 'react'
import { Link } from 'react-router'
import type { Aluno } from '../lib/aluno'
import { TEMAS } from '../lib/temas'
import BotaoLink from './BotaoLink'
import Card from './Card'
import Figura from './Figura'
import MenuAcoes, { classeItemMenu } from './MenuAcoes'
import TransferirAluno from './TransferirAluno'

interface CardAlunoProps {
  aluno: Aluno
  aoPedirExclusao: (aluno: Aluno) => void
}

export default function CardAluno({ aluno, aoPedirExclusao }: CardAlunoProps) {
  const [transferindo, setTransferindo] = useState(false)
  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-start gap-3">
        <Figura nome={TEMAS[aluno.perfil.tema].icone} alt="" className="size-12 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-2xl font-extrabold break-words">{aluno.nome}</h2>
          <p className="text-tinta-suave">{aluno.turma || 'Sem turma'}</p>
        </div>
        <MenuAcoes rotulo={`Mais opções para ${aluno.nome}`}>
          {(fechar) => (
            <>
              <Link to={`/aluno/${aluno.id}/editar`} className={classeItemMenu}>
                Editar
              </Link>
              <button
                type="button"
                className={classeItemMenu}
                onClick={() => {
                  fechar()
                  setTransferindo(true)
                }}
              >
                Transferir / compartilhar
              </button>
              <button
                type="button"
                className={`${classeItemMenu} text-vermelho`}
                onClick={() => {
                  fechar()
                  aoPedirExclusao(aluno)
                }}
              >
                Excluir
              </button>
            </>
          )}
        </MenuAcoes>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3">
        <BotaoLink
          to={`/aluno/${aluno.id}/atividades`}
          tamanho="grande"
          className="px-3"
          aria-label={`Atividades de ${aluno.nome}`}
        >
          Atividades
        </BotaoLink>
        <BotaoLink
          to={`/aluno/${aluno.id}/progresso`}
          variante="secundario"
          tamanho="grande"
          className="px-3"
          aria-label={`Progresso de ${aluno.nome}`}
        >
          Progresso
        </BotaoLink>
      </div>
      {transferindo && <TransferirAluno aluno={aluno} aoFechar={() => setTransferindo(false)} />}
    </Card>
  )
}
