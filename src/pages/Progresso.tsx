import type { User } from 'firebase/auth'
import { useParams } from 'react-router'
import BotaoLink from '../components/BotaoLink'
import LayoutLogado from '../components/LayoutLogado'
import RelatorioProgresso from '../components/progresso/RelatorioProgresso'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAluno } from '../hooks/useAluno'
import { useSessoes } from '../hooks/useSessoes'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { Aluno } from '../lib/aluno'
import { salvarAnalise } from '../lib/alunos'

export default function Progresso() {
  const { id = null } = useParams()
  const usuario = useUsuarioLogado()
  const estado = useAluno(usuario.uid, id)
  useTituloPagina(estado.situacao === 'pronto' ? `Progresso de ${estado.aluno.nome}` : 'Progresso')

  if (estado.situacao !== 'pronto' || !id) {
    return (
      <LayoutLogado>
        {estado.situacao === 'carregando' ? (
          <p role="status" className="text-lg text-tinta-suave">
            Carregando…
          </p>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-xl font-bold">
              {estado.situacao === 'erro'
                ? 'Não foi possível carregar o aluno. Verifique a internet e tente de novo.'
                : 'Aluno não encontrado. Ele pode ter sido excluído.'}
            </p>
            <BotaoLink to="/painel">Voltar para meus alunos</BotaoLink>
          </div>
        )}
      </LayoutLogado>
    )
  }

  return (
    <LayoutLogado>
      <RelatorioDoAluno usuario={usuario} aluno={estado.aluno} />
    </LayoutLogado>
  )
}

function RelatorioDoAluno({ usuario, aluno }: { usuario: User; aluno: Aluno }) {
  const { sessoes, carregando, erro } = useSessoes(usuario.uid, aluno.id)
  return (
    <RelatorioProgresso
      aluno={aluno}
      sessoes={sessoes}
      carregando={carregando}
      erro={erro}
      gerador={{
        usuario,
        salvar: (analise, periodo, rodadas) =>
          salvarAnalise(usuario.uid, aluno.id, analise, periodo, rodadas),
      }}
    />
  )
}
