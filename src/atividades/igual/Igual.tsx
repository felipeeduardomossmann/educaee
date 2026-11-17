import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { corDaFigura, type Rgb } from '../../lib/cor-figura'
import type { NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import BotaoOpcao from '../BotaoOpcao'
import { calcularGrade } from '../grade'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import { criarDesafio, OPCOES_POR_NIVEL, type DesafioIgual, INSTRUCAO } from './logica'

const ESPACO = 16
const ESPACO_MODELO = 32
const LADO_MODELO_MAXIMO = 200
const FRACAO_MODELO = 0.32

type Cores = Partial<Record<NomeFigura, Rgb>>

/** Encontre o igual. No nível 4, as opções têm cores parecidas com o modelo. */
export default function Igual(props: PropsAtividade) {
  const { nivel, tema } = props
  // As cores só importam no nível 4: são medidas antes de começar.
  const [cores, setCores] = useState<Cores | null>(nivel >= 4 ? null : {})

  useEffect(() => {
    if (nivel < 4) return
    let ativo = true
    const figuras = TEMAS[tema].figuras
    Promise.all(figuras.map((figura) => corDaFigura(figura).catch(() => undefined)))
      .then((lista) => {
        if (!ativo) return
        setCores(Object.fromEntries(figuras.map((figura, i) => [figura, lista[i]])) as Cores)
      })
      .catch(() => ativo && setCores({}))
    return () => {
      ativo = false
    }
  }, [nivel, tema])

  if (!cores) return <p className="text-xl font-semibold">Preparando…</p>
  return <JogoIgual {...props} cores={cores} />
}

function JogoIgual({
  nivel,
  perfil,
  tema,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
  cores,
}: PropsAtividade & { cores: Cores }) {
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const [desafio, setDesafio] = useState<DesafioIgual>(() =>
    criarDesafio(figuras, nivel, null, cores),
  )
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => setDesafio((atual) => criarDesafio(figuras, nivel, atual.modelo, cores)),
  })

  // Mede a área inteira (topo fixo): o modelo fica com ~1/3 da altura e as opções com o
  // resto, sem nunca ficarem maiores que o modelo (ele é o destaque).
  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const ladoModelo = Math.round(
    Math.max(aparencia.areaToque, Math.min(LADO_MODELO_MAXIMO, altura * FRACAO_MODELO)),
  )
  const grade = calcularGrade({
    quantidade: OPCOES_POR_NIVEL[nivel] ?? 2,
    largura,
    altura: altura - ladoModelo - ESPACO_MODELO,
    espaco: ESPACO,
    minimo: aparencia.areaToque,
    maximo: ladoModelo,
  })

  useEffect(() => {
    instruir(INSTRUCAO)
  }, [desafio, instruir])

  const tocar = (figura: NomeFigura) => {
    if (pausado || emTransicao) return
    if (figura === desafio.modelo) acertar()
    else errou()
  }

  return (
    <div
      ref={refArea}
      className="flex w-full flex-1 flex-col items-center justify-center"
      style={{ gap: ESPACO_MODELO }}
    >
      <div
        aria-label={`Modelo: ${nomeLegivel(desafio.modelo)}`}
        role="img"
        style={{ width: ladoModelo, height: ladoModelo }}
        className={`flex shrink-0 items-center justify-center rounded-3xl ${
          aparencia.altoContraste
            ? 'border-8 border-double border-ac-contorno bg-ac-fundo'
            : 'border-4 border-dashed border-azul/50 bg-sol'
        }`}
      >
        <Figura nome={desafio.modelo} alt="" className="size-[72%]" />
      </div>

      {largura > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{
            width: grade.colunas * grade.lado + (grade.colunas - 1) * ESPACO,
            gap: ESPACO,
          }}
        >
          {desafio.opcoes.map((figura) => (
            <BotaoOpcao
              key={figura}
              aparencia={aparencia}
              rotulo={nomeLegivel(figura)}
              largura={grade.lado}
              certa={emTransicao && figura === desafio.modelo}
              aoTocar={() => tocar(figura)}
            >
              <Figura nome={figura} alt="" className="size-[70%]" />
            </BotaoOpcao>
          ))}
        </div>
      )}
    </div>
  )
}
