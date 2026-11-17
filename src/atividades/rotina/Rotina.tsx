import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { useAparencia } from '../aparencia'
import EscolhaComModelo from '../EscolhaComModelo'
import type { PropsAtividade } from '../tipos'
import { useJogadas } from '../useJogadas'
import { criarDesafio, INSTRUCAO, JOGADAS_ROTINA, type DesafioRotina } from './logica'

/** Rotina do dia: tocar as cenas na ordem; elas vão para os espaços numerados em cima. */
export default function Rotina({
  nivel,
  perfil,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const [desafio, setDesafio] = useState<DesafioRotina>(() => criarDesafio(nivel, null))
  const [colocadas, setColocadas] = useState(0)
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      setDesafio((atual) => criarDesafio(nivel, atual))
      setColocadas(0)
    },
    total: JOGADAS_ROTINA,
  })

  useEffect(() => {
    instruir(INSTRUCAO)
  }, [desafio, instruir])

  const noLugar = desafio.prontas + colocadas
  const caixa = aparencia.altoContraste
    ? 'border-4 border-ac-contorno'
    : 'border-4 border-dashed border-azul/50 bg-white'

  const espacos = (
    <div className="flex size-full items-center justify-center gap-[3%] px-[3%]">
      {desafio.cenas.map((cena, i) => (
        <span
          key={i}
          className={`relative flex aspect-square max-h-[80%] w-[min(21%,9rem)] items-center justify-center rounded-2xl ${caixa}`}
        >
          <span className="absolute top-0.5 left-1.5 text-sm font-extrabold opacity-70 sm:text-lg">
            {i + 1}
          </span>
          {i < noLugar && <Figura nome={cena.figura} alt="" className="mt-[12%] size-[60%]" />}
        </span>
      ))}
    </div>
  )

  return (
    <EscolhaComModelo
      aparencia={aparencia}
      modelo={espacos}
      rotuloModelo={`Ordem: ${desafio.cenas
        .slice(0, noLugar)
        .map((cena) => cena.rotulo)
        .join(', ')}${noLugar < desafio.cenas.length ? ', ...' : ''}`}
      modeloLargo
      fracaoModelo={0.36}
      opcoes={desafio.pecas
        .filter((i) => i >= noLugar)
        .map((i) => ({
          chave: String(i),
          rotulo: desafio.cenas[i]?.rotulo ?? '',
          conteudo: (
            <Figura nome={desafio.cenas[i]?.figura ?? 'estrela'} alt="" className="size-[70%]" />
          ),
        }))}
      certa=""
      emTransicao={emTransicao}
      aoTocar={(chave) => {
        if (pausado || emTransicao) return
        const indice = Number(chave)
        // Cenas iguais (ex.: dois ovos) valem pela figura, não pela posição.
        const esperada = desafio.cenas[noLugar]
        if (desafio.cenas[indice]?.figura !== esperada?.figura) {
          errou()
          return
        }
        // Se a peça tocada era outra cena igual, troca para manter a ordem.
        if (indice !== noLugar) {
          setDesafio((d) => ({
            ...d,
            pecas: d.pecas.map((p) => (p === indice ? noLugar : p === noLugar ? indice : p)),
          }))
        }
        const novas = colocadas + 1
        setColocadas(novas)
        if (desafio.prontas + novas === desafio.cenas.length) acertar()
      }}
    />
  )
}
