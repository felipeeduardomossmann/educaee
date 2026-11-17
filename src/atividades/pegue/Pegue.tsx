import { useEffect, useRef, useState } from 'react'
import Figura from '../../components/Figura'
import { sortear } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import BotaoOpcao from '../BotaoOpcao'
import { calcularGrade } from '../grade'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import {
  criarGrade,
  instrucaoGrade,
  instrucaoSequencia,
  JOGADAS_GRADE,
  JOGADAS_SEQUENCIA,
  NIVEL_SEQUENCIA,
  proximaAparicao,
  TEMPO_NA_TELA_MS,
  type DesafioGrade,
} from './logica'

const ESPACO = 16

/** Pegue só o...: tocar só na figura pedida (grade nos níveis 1 a 3; uma por vez no 4). */
export default function Pegue(props: PropsAtividade) {
  return props.nivel >= NIVEL_SEQUENCIA ? <PegueSequencia {...props} /> : <PegueGrade {...props} />
}

function PegueGrade({
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
  const [desafio, setDesafio] = useState<DesafioGrade>(() => criarGrade(figuras, nivel, null))
  const [pegas, setPegas] = useState<number[]>([])
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      setDesafio((atual) => criarGrade(figuras, nivel, atual))
      setPegas([])
    },
    total: JOGADAS_GRADE,
  })
  const { ref, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const grade = calcularGrade({
    quantidade: desafio.itens.length,
    largura,
    altura,
    espaco: ESPACO,
    minimo: aparencia.areaToque,
    maximo: 220,
  })
  const totalAlvos = desafio.itens.filter((f) => f === desafio.alvo).length

  useEffect(() => {
    instruir(instrucaoGrade(desafio.alvo))
  }, [desafio, instruir])

  const tocar = (indice: number) => {
    if (pausado || emTransicao || pegas.includes(indice)) return
    if (desafio.itens[indice] !== desafio.alvo) {
      errou()
      return
    }
    const novas = [...pegas, indice]
    setPegas(novas)
    // A jogada termina quando todas as figuras pedidas foram tocadas.
    if (novas.length >= totalAlvos) acertar()
  }

  return (
    <div ref={ref} className="flex w-full flex-1 items-center justify-center">
      {largura > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{ width: grade.colunas * grade.lado + (grade.colunas - 1) * ESPACO, gap: ESPACO }}
        >
          {desafio.itens.map((figura, i) => (
            <BotaoOpcao
              key={`${desafio.alvo}-${i}`}
              aparencia={aparencia}
              rotulo={`${nomeLegivel(figura)}${pegas.includes(i) ? ', já tocado' : ''}`}
              largura={grade.lado}
              certa={pegas.includes(i)}
              aoTocar={() => tocar(i)}
            >
              <Figura nome={figura} alt="" className="size-[70%]" />
            </BotaoOpcao>
          ))}
        </div>
      )}
    </div>
  )
}

function PegueSequencia({
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
  const [alvo, setAlvo] = useState<NomeFigura>(() => sortear(figuras, 1)[0] as NomeFigura)
  const [atual, setAtual] = useState<{ figura: NomeFigura; vez: number }>(() => ({
    figura: proximaAparicao(alvo, figuras, 0),
    vez: 0,
  }))
  const outrasSeguidas = useRef(0)
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      // Depois de cada acerto, a próxima figura pedida muda.
      const novo = sortear(
        figuras.filter((f) => f !== alvo),
        1,
      )[0] as NomeFigura
      setAlvo(novo)
      outrasSeguidas.current = 0
      setAtual((a) => ({ figura: proximaAparicao(novo, figuras, 0), vez: a.vez + 1 }))
    },
    total: JOGADAS_SEQUENCIA,
  })
  const { ref, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const lado = Math.max(aparencia.areaToque, Math.min(300, Math.min(largura, altura) * 0.6))

  useEffect(() => {
    instruir(instrucaoSequencia(alvo))
  }, [alvo, instruir])

  // Cada figura fica um tempo na tela e dá lugar à próxima (o tempo para em pausa).
  useEffect(() => {
    if (pausado || emTransicao) return
    const temporizador = window.setTimeout(() => {
      outrasSeguidas.current = atual.figura === alvo ? 0 : outrasSeguidas.current + 1
      setAtual((a) => ({
        figura: proximaAparicao(alvo, figuras, outrasSeguidas.current),
        vez: a.vez + 1,
      }))
    }, TEMPO_NA_TELA_MS)
    return () => window.clearTimeout(temporizador)
  }, [atual, alvo, figuras, pausado, emTransicao])

  const tocar = () => {
    if (pausado || emTransicao) return
    if (atual.figura === alvo) acertar()
    else errou()
  }

  return (
    <div ref={ref} className="flex w-full flex-1 items-center justify-center">
      {largura > 0 && (
        <BotaoOpcao
          key={atual.vez}
          aparencia={aparencia}
          rotulo={nomeLegivel(atual.figura)}
          largura={lado}
          certa={emTransicao}
          aoTocar={tocar}
        >
          <Figura nome={atual.figura} alt="" className="size-[72%]" />
        </BotaoOpcao>
      )}
    </div>
  )
}
