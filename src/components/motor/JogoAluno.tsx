import { Navigate } from 'react-router'
import { telaDeEscolha } from '../../atividades/navegacao'
import { marcarEtapa } from '../../lib/trilha'
import type { DefinicaoAtividade } from '../../atividades/tipos'
import { useUsuarioLogado } from '../../contexts/sessao-contexto'
import { useAluno } from '../../hooks/useAluno'
import { atualizarNivel } from '../../lib/alunos'
import { buscarSessoesRecentes, registrarSessao } from '../../lib/sessoes'
import Carregando from '../Carregando'
import type { FonteJogo } from './fonte'
import Jogo from './Jogo'

interface JogoAlunoProps {
  definicao: DefinicaoAtividade
  alunoId: string
  nivel: number
  /** Índice da etapa, quando faz parte da trilha do dia. */
  etapaTrilha: number | null
}

/** Atividade jogada por um aluno: aplica o perfil dele, grava cada rodada e sugere o nível. */
export default function JogoAluno({ definicao, alunoId, nivel, etapaTrilha }: JogoAlunoProps) {
  const usuario = useUsuarioLogado()
  const estado = useAluno(usuario.uid, alunoId)

  if (estado.situacao === 'carregando') return <Carregando />
  if (estado.situacao !== 'pronto') return <Navigate to="/painel" replace />
  const { aluno } = estado

  const fonte: FonteJogo = {
    nivelAtual: aluno.niveis[definicao.id],
    registrar: (resultado, nivelJogado) => {
      const { id, salva } = registrarSessao(
        usuario.uid,
        alunoId,
        definicao.id,
        nivelJogado,
        resultado,
      )
      // A rodada recém-gravada (pelo id) fica de fora: ela já entra como "a atual".
      const anteriores = buscarSessoesRecentes(usuario.uid, alunoId).then((sessoes) =>
        sessoes.filter(
          (s) => s.id !== id && s.atividadeId === definicao.id && s.nivel === nivelJogado,
        ),
      )
      return { salva, anteriores }
    },
    aceitarNivel: (novo) => {
      atualizarNivel(usuario.uid, alunoId, definicao.id, novo).catch((falha: unknown) =>
        console.error(falha),
      )
    },
  }

  return (
    <Jogo
      definicao={definicao}
      nivel={nivel}
      perfil={aluno.perfil}
      nomeAluno={aluno.nome}
      telaEscolha={telaDeEscolha({ tipo: 'aluno', alunoId }, etapaTrilha !== null)}
      fonte={fonte}
      trilha={
        etapaTrilha === null ? undefined : { aoConcluir: () => marcarEtapa(alunoId, etapaTrilha) }
      }
    />
  )
}
