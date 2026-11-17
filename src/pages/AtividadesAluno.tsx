import { useNavigate, useParams } from 'react-router'
import { irParaAtividade } from '../atividades/navegacao'
import BotaoLink from '../components/BotaoLink'
import EscolhaAtividade from '../components/EscolhaAtividade'
import Figura from '../components/Figura'
import Mascote from '../components/Mascote'
import LayoutLogado from '../components/LayoutLogado'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAluno } from '../hooks/useAluno'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { atualizarPerfil } from '../lib/alunos'

export default function AtividadesAluno() {
  const { id = null } = useParams()
  const usuario = useUsuarioLogado()
  const navigate = useNavigate()
  const estado = useAluno(usuario.uid, id)
  useTituloPagina(
    estado.situacao === 'pronto' ? `Atividades de ${estado.aluno.nome}` : 'Atividades',
  )

  if (estado.situacao !== 'pronto') {
    return (
      <LayoutLogado>
        {estado.situacao === 'carregando' ? (
          <p role="status" className="text-lg text-tinta-suave">
            Carregando…
          </p>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-xl font-bold">
              {estado.situacao === 'nao-encontrado'
                ? 'Aluno não encontrado. Ele pode ter sido excluído.'
                : 'Não foi possível carregar o aluno. Verifique a internet e tente de novo.'}
            </p>
            <BotaoLink to="/painel">Voltar para meus alunos</BotaoLink>
          </div>
        )}
      </LayoutLogado>
    )
  }

  const { aluno } = estado

  return (
    <LayoutLogado>
      <EscolhaAtividade
        nomeJogador={aluno.nome}
        perfil={aluno.perfil}
        niveis={aluno.niveis}
        avisoAjustes={`Os ajustes ficam salvos no perfil de ${aluno.nome}.`}
        destaque={
          <div className="flex flex-col gap-3">
            <BotaoLink
              to={`/aluno/${aluno.id}/trilha`}
              className="flex min-h-28 items-center justify-start gap-5 rounded-3xl bg-verde p-5 text-left text-sobre-cor hover:bg-verde/90"
            >
              <Mascote className="size-20 shrink-0" />
              <span className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold">Trilha do dia</span>
                <span className="text-lg font-semibold">
                  4 atividades escolhidas para {aluno.nome} hoje
                </span>
              </span>
              <Figura nome="continuar" alt="" className="ml-auto size-12 shrink-0" />
            </BotaoLink>
            <BotaoLink
              to={`/aluno/${aluno.id}/prancha`}
              variante="secundario"
              tamanho="grande"
              className="self-start"
            >
              <Figura nome="prancha" alt="" className="size-8" />
              Prancha de {aluno.nome}
            </BotaoLink>
          </div>
        }
        aoSalvarPerfil={(perfil) => {
          // Salva na cópia local na hora; o envio ao servidor segue em segundo plano.
          atualizarPerfil(usuario.uid, aluno.id, perfil).catch((falha: unknown) =>
            console.error(falha),
          )
        }}
        aoComecar={(atividadeId, nivel) =>
          irParaAtividade(navigate, atividadeId, {
            jogador: { tipo: 'aluno', alunoId: aluno.id },
            nivel,
          })
        }
      />
    </LayoutLogado>
  )
}
