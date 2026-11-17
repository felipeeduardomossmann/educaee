import Figura from '../../components/Figura'
import type { NomeFigura } from '../../lib/figuras'
import { nomeFalado } from '../../lib/nomes-falados'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import { useDesafios } from '../useDesafios'
import type { PropsAtividade } from '../tipos'
import { criarDesafio, instrucao, respostaCerta } from './logica'

/** Figuras repetidas em grade (para contar). */
export function Grupo({ figura, quantidade }: { figura: NomeFigura; quantidade: number }) {
  const colunas = quantidade <= 3 ? quantidade : quantidade <= 6 ? 3 : quantidade <= 8 ? 4 : 5
  const linhas = Math.ceil(quantidade / colunas)
  return (
    <div
      className="grid size-full place-items-center gap-2 p-3"
      style={{
        gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${linhas}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: quantidade }, (_, i) => (
        <Figura key={i} nome={figura} alt="" className="aspect-square max-h-full max-w-full" />
      ))}
    </div>
  )
}

/** Contar: quantas figuras há (e toque no número) ou qual grupo tem mais. */
export default function Contar(props: PropsAtividade) {
  const { nivel, perfil, tema, pausado, errou } = props
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const { desafio, emTransicao, acertar } = useDesafios(
    props,
    (anterior) => criarDesafio(figuras, nivel, anterior),
    instrucao,
  )
  const certa = respostaCerta(desafio)
  const tocar = (chave: string) => {
    if (pausado || emTransicao) return
    if (chave === certa) acertar()
    else errou()
  }
  const { plural } = nomeFalado(desafio.figura)

  if (desafio.tipo === 'mais') {
    return (
      <EscolhaComModelo
        aparencia={aparencia}
        proporcao={1.4}
        opcoes={desafio.grupos.map((quantidade, i) => ({
          chave: String(i),
          rotulo: `Grupo ${i + 1}: ${quantidade} ${plural}`,
          conteudo: <Grupo figura={desafio.figura} quantidade={quantidade} />,
        }))}
        certa={certa}
        emTransicao={emTransicao}
        aoTocar={tocar}
      />
    )
  }

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={<Grupo figura={desafio.figura} quantidade={desafio.quantidade} />}
      rotuloModelo={`${plural} para contar`}
      modeloLargo
      fracaoModelo={0.42}
      opcoes={desafio.opcoes.map((n) => ({
        chave: String(n),
        rotulo: String(n),
        conteudo: <span className="text-6xl leading-none font-extrabold">{n}</span>,
      }))}
      certa={certa}
      emTransicao={emTransicao}
      aoTocar={tocar}
    />
  )
}
