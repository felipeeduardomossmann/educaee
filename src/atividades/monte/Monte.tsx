import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import { falaDaCarta } from '../memoria/logica'
import type { PropsAtividade } from '../tipos'
import { useJogadas } from '../useJogadas'
import { criarDesafio, ehAProxima, instrucao, JOGADAS_MONTE, type DesafioMonte } from './logica'

/** Monte a palavra: tocar as sílabas na ordem para montar o nome da figura. */
export default function Monte({
  nivel,
  perfil,
  pausado,
  instruir,
  dizer,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const [desafio, setDesafio] = useState<DesafioMonte>(() => criarDesafio(nivel, null))
  const [usadas, setUsadas] = useState<number[]>([])
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      setDesafio((atual) => criarDesafio(nivel, atual))
      setUsadas([])
    },
    total: JOGADAS_MONTE,
  })

  useEffect(() => {
    const { texto, fala } = instrucao(desafio)
    instruir(texto, fala)
  }, [desafio, instruir])

  const silabas = desafio.palavra.silabas
  const montadas = usadas.length
  const caixa = aparencia.altoContraste
    ? 'border-4 border-ac-contorno'
    : 'border-4 border-dashed border-azul/50 bg-white'

  const modelo = (
    <div className="flex size-full items-center justify-center gap-[4%] px-[4%]">
      <Figura
        nome={desafio.palavra.figura}
        alt=""
        className="aspect-square max-h-[78%] w-[min(24%,10rem)]"
      />
      <div className="flex min-w-0 items-center gap-[2%]">
        {silabas.map((silaba, i) => (
          <span
            key={i}
            className={`flex aspect-square w-[min(19vw,8rem)] items-center justify-center rounded-2xl text-2xl font-extrabold sm:text-4xl ${caixa}`}
          >
            {i < montadas ? silaba : ''}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={modelo}
      rotuloModelo={`Palavra com ${silabas.length} sílabas; ${montadas} já montadas`}
      modeloLargo
      fracaoModelo={0.4}
      proporcao={1.3}
      opcoes={desafio.pecas
        .filter((p) => !usadas.includes(p.id))
        .map((p) => ({
          chave: String(p.id),
          rotulo: p.silaba.toLowerCase(),
          conteudo: <span className="text-4xl font-extrabold sm:text-5xl">{p.silaba}</span>,
        }))}
      certa=""
      emTransicao={emTransicao}
      aoTocar={(chave) => {
        if (pausado || emTransicao) return
        const peca = desafio.pecas.find((p) => String(p.id) === chave)
        if (!peca) return
        if (!ehAProxima(desafio, montadas, peca)) {
          errou()
          return
        }
        const novas = [...usadas, peca.id]
        setUsadas(novas)
        if (novas.length === silabas.length) {
          dizer(falaDaCarta({ figura: desafio.palavra.figura }))
          acertar()
        }
      }}
    />
  )
}
