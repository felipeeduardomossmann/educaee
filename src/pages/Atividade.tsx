import { lazy, Suspense } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import { lerEstadoAtividade } from '../atividades/navegacao'
import { buscarAtividade } from '../atividades/registro'
import Carregando from '../components/Carregando'
import JogoConvidado from '../components/motor/JogoConvidado'
import { useConvidado } from '../contexts/convidado-contexto'
import { useSessao } from '../contexts/sessao-contexto'
import { NIVEL_MAXIMO, NIVEL_MINIMO } from '../lib/atividade'

// Só quem joga com aluno precisa do banco: o convidado não carrega o Firestore.
const JogoAluno = lazy(() => import('../components/motor/JogoAluno'))

/** /atividade/:atividadeId — recebe o aluno ou o convidado pelo estado da navegação. */
export default function Atividade() {
  const { atividadeId } = useParams()
  const location = useLocation()
  const { usuario, carregando } = useSessao()
  const convidado = useConvidado()

  const definicao = buscarAtividade(atividadeId)
  const estado = lerEstadoAtividade(location.state)

  if (carregando) return <Carregando />

  const voltar = usuario ? '/painel' : '/convidado'
  if (!definicao || !estado) return <Navigate to={voltar} replace />
  const nivel = Math.min(NIVEL_MAXIMO, Math.max(NIVEL_MINIMO, Math.round(estado.nivel)))

  if (estado.jogador.tipo === 'convidado') {
    // Ao recarregar, o modo convidado recomeça do zero: volta para a escolha.
    if (usuario || !convidado.ativo) return <Navigate to={voltar} replace />
    return <JogoConvidado definicao={definicao} nivel={nivel} />
  }

  if (!usuario) return <Navigate to="/" replace />
  return (
    <Suspense fallback={<Carregando />}>
      <JogoAluno
        definicao={definicao}
        alunoId={estado.jogador.alunoId}
        nivel={nivel}
        etapaTrilha={estado.trilha?.etapa ?? null}
      />
    </Suspense>
  )
}
