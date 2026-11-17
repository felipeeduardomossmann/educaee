import Figura from '../../components/Figura'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import { useDesafios } from '../useDesafios'
import type { PropsAtividade } from '../tipos'
import { criarDesafio, EMOCOES, instrucao } from './logica'

/** Emoções: ouvir o nome de uma emoção (ou uma situação) e tocar no rosto certo. */
export default function Emocoes(props: PropsAtividade) {
  const { nivel, perfil, pausado, errou } = props
  const aparencia = useAparencia(perfil)
  const { desafio, emTransicao, acertar } = useDesafios(
    props,
    (anterior) => criarDesafio(nivel, anterior),
    instrucao,
  )

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      opcoes={desafio.opcoes.map((id) => ({
        chave: id,
        rotulo: `rosto ${EMOCOES[id].nome}`,
        conteudo: <Figura nome={EMOCOES[id].figura} alt="" className="size-[72%]" />,
      }))}
      certa={desafio.alvo}
      emTransicao={emTransicao}
      aoTocar={(id) => {
        if (pausado || emTransicao) return
        if (id === desafio.alvo) acertar()
        else errou()
      }}
    />
  )
}
