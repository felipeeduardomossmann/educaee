import type { DefinicaoAtividade } from '../../atividades/tipos'
import { useConvidado } from '../../contexts/convidado-contexto'
import type { FonteJogo } from './fonte'
import Jogo from './Jogo'

interface JogoConvidadoProps {
  definicao: DefinicaoAtividade
  nivel: number
}

/** Atividade no modo convidado: as rodadas ficam só em memória. */
export default function JogoConvidado({ definicao, nivel }: JogoConvidadoProps) {
  const convidado = useConvidado()

  const fonte: FonteJogo = {
    nivelAtual: convidado.niveis[definicao.id],
    registrar: (resultado, nivelJogado) => {
      const anteriores = convidado.rodadas.filter(
        (r) => r.atividadeId === definicao.id && r.nivel === nivelJogado,
      )
      convidado.guardarRodada({ atividadeId: definicao.id, nivel: nivelJogado, ...resultado })
      return { salva: null, anteriores: Promise.resolve(anteriores) }
    },
    aceitarNivel: (novo) => convidado.mudarNivel(definicao.id, novo),
  }

  return (
    <Jogo
      definicao={definicao}
      nivel={nivel}
      perfil={convidado.perfil}
      nomeAluno={null}
      telaEscolha="/convidado"
      fonte={fonte}
    />
  )
}
