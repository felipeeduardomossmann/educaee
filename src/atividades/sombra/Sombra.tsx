import Figura from '../../components/Figura'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useDesafios } from '../useDesafios'
import { criarDesafio, INSTRUCAO, type DesafioSombra } from './logica'

/** Qual é a sombra?: a figura colorida em cima; as opções são sombras (silhuetas). */
export default function Sombra(props: PropsAtividade) {
  const { nivel, perfil, tema, pausado, errou } = props
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const { desafio, emTransicao, acertar } = useDesafios<DesafioSombra>(
    props,
    (anterior) => criarDesafio(figuras, nivel, anterior),
    () => ({ texto: INSTRUCAO }),
  )
  // Sombra preta; no alto contraste (fundo escuro), branca.
  const silhueta = aparencia.altoContraste ? 'brightness-0 invert' : 'silhueta'

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={<Figura nome={desafio.modelo} alt="" className="size-[72%]" />}
      rotuloModelo={`Figura: ${nomeLegivel(desafio.modelo)}`}
      opcoes={desafio.opcoes.map((figura) => ({
        chave: figura,
        rotulo: `sombra de ${nomeLegivel(figura)}`,
        conteudo: <Figura nome={figura} alt="" className={`size-[70%] ${silhueta}`} />,
      }))}
      certa={desafio.modelo}
      emTransicao={emTransicao}
      aoTocar={(figura) => {
        if (pausado || emTransicao) return
        if (figura === desafio.modelo) acertar()
        else errou()
      }}
    />
  )
}
