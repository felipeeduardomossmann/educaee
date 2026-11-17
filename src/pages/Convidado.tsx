import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { irParaAtividade } from '../atividades/navegacao'
import Carregando from '../components/Carregando'
import EscolhaAtividade from '../components/EscolhaAtividade'
import LayoutConvidado from '../components/LayoutConvidado'
import CartaoRecurso from '../components/CartaoRecurso'
import RecursoBloqueado from '../components/RecursoBloqueado'
import { useConvidado } from '../contexts/convidado-contexto'
import { useSessao } from '../contexts/sessao-contexto'
import { useTituloPagina } from '../hooks/useTituloPagina'

export default function Convidado() {
  useTituloPagina('Modo convidado')
  const { usuario, carregando } = useSessao()
  const convidado = useConvidado()
  const navigate = useNavigate()
  const { ativar } = convidado

  useEffect(() => {
    ativar()
  }, [ativar])

  if (carregando) return <Carregando />
  // Quem já está logado usa as atividades a partir dos próprios alunos.
  if (usuario) return <Navigate to="/painel" replace />

  return (
    <LayoutConvidado>
      <EscolhaAtividade
        nomeJogador="Convidado"
        perfil={convidado.perfil}
        niveis={convidado.niveis}
        avisoAjustes="No modo convidado, os ajustes valem só até fechar ou recarregar a página."
        aoSalvarPerfil={convidado.mudarPerfil}
        aoComecar={(atividadeId, nivel) =>
          irParaAtividade(navigate, atividadeId, { jogador: { tipo: 'convidado' }, nivel })
        }
      />

      {/* Recursos só para quem entra: aparecem bloqueados no modo convidado. */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <RecursoBloqueado figura="giz-de-cera" titulo="Desenhos para colorir" />
        <RecursoBloqueado figura="televisao" titulo="Vídeos" />
        <CartaoRecurso
          figura="prancha"
          titulo="Prancha de comunicação"
          texto="Cartões com figuras: toque e o site fala."
          para="/prancha"
          rotulo="Abrir prancha"
          fundo="bg-menta"
        />
      </div>
    </LayoutConvidado>
  )
}
