import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useJogadas } from '../useJogadas'
import { criarDesafio, FALA_OLHAR, FALA_PERGUNTA, OLHAR_MS, type DesafioFaltando } from './logica'

/** O que está faltando?: olhar a fileira, uma figura vira "?", escolher qual sumiu. */
export default function Faltando({
  nivel,
  perfil,
  tema,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const [desafio, setDesafio] = useState<DesafioFaltando>(() => criarDesafio(figuras, nivel, null))
  const [olhando, setOlhando] = useState(true)
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      setDesafio((atual) => criarDesafio(figuras, nivel, atual))
      setOlhando(true)
    },
  })

  useEffect(() => {
    instruir(olhando ? FALA_OLHAR : FALA_PERGUNTA)
  }, [olhando, desafio, instruir])

  useEffect(() => {
    if (!olhando || pausado) return
    const temporizador = window.setTimeout(() => setOlhando(false), OLHAR_MS)
    return () => window.clearTimeout(temporizador)
  }, [olhando, pausado, desafio])

  const certa = desafio.fileira[desafio.sumiu] ?? ''
  const caixaVazia = aparencia.altoContraste
    ? 'border-4 border-dashed border-ac-contorno text-ac-contorno'
    : 'border-4 border-dashed border-azul/50 text-azul-escuro'

  const fileira = (
    <div className="flex size-full items-center justify-center gap-[3%] px-[3%]">
      {desafio.fileira.map((figura, i) =>
        !olhando && i === desafio.sumiu && !emTransicao ? (
          <span
            key={i}
            className={`flex aspect-square h-[70%] items-center justify-center rounded-2xl text-5xl font-extrabold ${caixaVazia}`}
          >
            ?
          </span>
        ) : (
          <Figura key={i} nome={figura} alt="" className="aspect-square h-[70%] max-w-[18%]" />
        ),
      )}
    </div>
  )

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={fileira}
      rotuloModelo={
        olhando
          ? `Fileira: ${desafio.fileira.map(nomeLegivel).join(', ')}`
          : `Fileira com uma figura faltando`
      }
      modeloLargo
      fracaoModelo={olhando ? 0.6 : 0.36}
      opcoes={
        olhando
          ? []
          : desafio.opcoes.map((figura) => ({
              chave: figura,
              rotulo: nomeLegivel(figura),
              conteudo: <Figura nome={figura} alt="" className="size-[70%]" />,
            }))
      }
      certa={certa}
      emTransicao={emTransicao}
      aoTocar={(figura) => {
        if (pausado || emTransicao || olhando) return
        if (figura === certa) acertar()
        else errou()
      }}
    />
  )
}
