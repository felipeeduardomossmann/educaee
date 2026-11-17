import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { useAparencia } from '../aparencia'
import BotaoOpcao from '../BotaoOpcao'
import { calcularGrade } from '../grade'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import type { ItemLetras } from './dados'
import { criarDesafio, OPCOES, type DesafioLetras } from './logica'

const ESPACO = 16
const ESPACO_FIGURA = 32
const LADO_MAXIMO = 200
const LADO_FIGURA_MAXIMO = 180
const FRACAO_FIGURA = 0.32

/** Tamanho da letra proporcional ao botão: quanto mais letras, menor. */
function tamanhoFonte(texto: string, lado: number): number {
  const fator = [0, 0.55, 0.42, 0.32, 0.26][Math.min(texto.length, 4)] ?? 0.26
  return Math.round(lado * fator)
}

/** Letras e sílabas: a voz fala e o aluno toca na opção certa. */
export default function Letras({
  nivel,
  perfil,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const [desafio, setDesafio] = useState<DesafioLetras>(() => criarDesafio(nivel, null))
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => setDesafio((atual) => criarDesafio(nivel, atual.alvo)),
  })

  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const figura = desafio.alvo.figura
  const ladoFigura = figura
    ? Math.round(
        Math.max(aparencia.areaToque, Math.min(LADO_FIGURA_MAXIMO, altura * FRACAO_FIGURA)),
      )
    : 0
  const grade = calcularGrade({
    quantidade: OPCOES,
    largura,
    altura: altura - (figura ? ladoFigura + ESPACO_FIGURA : 0),
    espaco: ESPACO,
    minimo: aparencia.areaToque,
    maximo: LADO_MAXIMO,
  })

  useEffect(() => {
    instruir(desafio.instrucao.texto, desafio.instrucao.fala)
  }, [desafio, instruir])

  const tocar = (item: ItemLetras) => {
    if (pausado || emTransicao) return
    if (item === desafio.alvo) acertar()
    else errou()
  }

  return (
    <div
      ref={refArea}
      className="flex w-full flex-1 flex-col items-center justify-center"
      style={{ gap: ESPACO_FIGURA }}
    >
      {figura && (
        <div
          role="img"
          aria-label="Figura"
          style={{ width: ladoFigura, height: ladoFigura }}
          className={`flex shrink-0 items-center justify-center rounded-3xl ${
            aparencia.altoContraste
              ? 'border-8 border-double border-ac-contorno bg-ac-fundo'
              : 'border-4 border-dashed border-azul/50 bg-sol'
          }`}
        >
          <Figura nome={figura} alt="" className="size-[72%]" />
        </div>
      )}
      {largura > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{ width: grade.colunas * grade.lado + (grade.colunas - 1) * ESPACO, gap: ESPACO }}
        >
          {desafio.opcoes.map((item) => (
            <BotaoOpcao
              key={item.texto}
              aparencia={aparencia}
              rotulo={item.fala}
              largura={grade.lado}
              certa={emTransicao && item === desafio.alvo}
              aoTocar={() => tocar(item)}
            >
              <span
                className="leading-none font-extrabold tracking-wide"
                style={{ fontSize: tamanhoFonte(item.texto, grade.lado) }}
              >
                {item.texto}
              </span>
            </BotaoOpcao>
          ))}
        </div>
      )}
    </div>
  )
}
