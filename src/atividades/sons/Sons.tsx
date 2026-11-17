import Figura from '../../components/Figura'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import type { PropsAtividade } from '../tipos'
import { useDesafios } from '../useDesafios'
import { criarDesafio, instrucao, type DesafioSons, type Palavra } from './logica'

/** Figura com a palavra embaixo (apoio para quem já lê). */
function FiguraComPalavra({ palavra }: { palavra: Palavra }) {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-1 p-2">
      <Figura nome={palavra.figura} alt="" className="min-h-0 w-[62%] flex-1 object-contain" />
      <span className="text-lg font-extrabold tracking-wide">{palavra.texto}</span>
    </span>
  )
}

/** Sons das palavras: qual começa com a sílaba (níveis 1 e 2) ou qual rima (3 e 4). */
export default function Sons(props: PropsAtividade) {
  const { nivel, perfil, pausado, errou } = props
  const aparencia = useAparencia(perfil)
  const { desafio, emTransicao, acertar } = useDesafios<DesafioSons>(
    props,
    (anterior) => criarDesafio(nivel, anterior),
    instrucao,
  )

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={desafio.tipo === 'rima' ? <FiguraComPalavra palavra={desafio.modelo} /> : undefined}
      rotuloModelo={desafio.tipo === 'rima' ? desafio.modelo.texto.toLowerCase() : undefined}
      opcoes={desafio.opcoes.map((p) => ({
        chave: p.figura,
        rotulo: p.texto.toLowerCase(),
        conteudo: <FiguraComPalavra palavra={p} />,
      }))}
      certa={desafio.certa.figura}
      emTransicao={emTransicao}
      aoTocar={(figura) => {
        if (pausado || emTransicao) return
        if (figura === desafio.certa.figura) acertar()
        else errou()
      }}
    />
  )
}
