import { useEffect, useRef, useState } from 'react'
import Figura from '../../components/Figura'
import type { NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import {
  CENTRO,
  direcaoAleatoria,
  ladoDoAlvo,
  mover,
  NIVEL_ERRO_FORA,
  NIVEL_MOVIMENTO,
  NIVEL_CRESCE,
  ESCALA_INICIAL,
  DURACAO_CRESCER_MS,
  posicaoAleatoria,
  proximaFigura,
  type Movimento,
  INSTRUCAO,
} from './logica'

interface EstadoAlvo {
  figura: NomeFigura
  movimento: Movimento
}

function novoAlvo(nivel: number, anterior: EstadoAlvo | null, figuras: readonly NomeFigura[]) {
  return {
    figura: proximaFigura(figuras, anterior?.figura ?? null),
    movimento: {
      posicao: nivel === 1 ? CENTRO : posicaoAleatoria(anterior?.movimento.posicao ?? null),
      ...direcaoAleatoria(),
    },
  }
}

/** Toque no alvo. Do nível 3 em diante, tocar fora conta como erro; no 4, o alvo anda. */
export default function Alvo({
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
  const [alvo, setAlvo] = useState<EstadoAlvo>(() => novoAlvo(nivel, null, figuras))
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => setAlvo((atual) => novoAlvo(nivel, atual, figuras)),
  })

  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const lado = ladoDoAlvo(nivel, Math.min(largura, altura), aparencia.areaToque)
  const livreX = Math.max(0, largura - lado)
  const livreY = Math.max(0, altura - lado)
  const anda = nivel >= NIVEL_MOVIMENTO && !aparencia.animacoesReduzidas
  // Nível 1: o alvo aparece pequeno e cresce devagar (sem crescer, com animações reduzidas).
  const cresce = nivel <= NIVEL_CRESCE && !aparencia.animacoesReduzidas

  useEffect(() => {
    instruir(INSTRUCAO)
  }, [alvo.figura, instruir])

  // Movimento suave (nível 4): para em pausa, entre jogadas e com animações reduzidas.
  const espacoLivre = useRef({ livreX, livreY })
  useEffect(() => {
    espacoLivre.current = { livreX, livreY }
  })
  useEffect(() => {
    if (!anda || pausado || emTransicao) return
    let quadro = 0
    let anterior = performance.now()
    const passo = (agora: number) => {
      const dt = Math.min(0.1, (agora - anterior) / 1000)
      anterior = agora
      const { livreX: lx, livreY: ly } = espacoLivre.current
      setAlvo((atual) => ({ ...atual, movimento: mover(atual.movimento, dt, lx, ly) }))
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [anda, pausado, emTransicao])

  const tocarFora = () => {
    if (pausado || emTransicao || nivel < NIVEL_ERRO_FORA) return
    errou()
  }

  const { posicao } = alvo.movimento

  return (
    // A área inteira recebe os toques "fora" (erro só a partir do nível 3).
    <div
      ref={refArea}
      onClick={tocarFora}
      className="relative w-full flex-1 touch-manipulation select-none"
      style={{ minHeight: lado }}
    >
      {largura > 0 && !emTransicao && (
        <BotaoAlvo
          // Um botão novo a cada jogada (o nível 1 recomeça pequeno).
          key={alvo.figura}
          figura={alvo.figura}
          lado={lado}
          left={posicao.x * livreX}
          top={posicao.y * livreY}
          cresce={cresce}
          altoContraste={aparencia.altoContraste}
          aoTocar={() => {
            if (!pausado && !emTransicao) acertar()
          }}
        />
      )}
    </div>
  )
}

interface BotaoAlvoProps {
  figura: NomeFigura
  lado: number
  left: number
  top: number
  cresce: boolean
  altoContraste: boolean
  aoTocar: () => void
}

/** O alvo. Se `cresce`, aparece pequeno e cresce devagar até o tamanho normal. */
function BotaoAlvo({ figura, lado, left, top, cresce, altoContraste, aoTocar }: BotaoAlvoProps) {
  const [crescido, setCrescido] = useState(!cresce)
  useEffect(() => {
    if (!cresce) return
    // Dois quadros: o navegador desenha pequeno antes de começar a crescer.
    let segundo = 0
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setCrescido(true))
    })
    return () => {
      cancelAnimationFrame(primeiro)
      cancelAnimationFrame(segundo)
    }
  }, [cresce])

  return (
    <button
      type="button"
      aria-label={`Alvo: ${nomeLegivel(figura)}`}
      onClick={(evento) => {
        evento.stopPropagation()
        aoTocar()
      }}
      style={{
        width: lado,
        height: lado,
        left,
        top,
        transform: crescido ? 'scale(1)' : `scale(${ESCALA_INICIAL})`,
        transition: cresce ? `transform ${DURACAO_CRESCER_MS}ms ease-out` : undefined,
      }}
      className={`absolute flex items-center justify-center rounded-full ${
        altoContraste
          ? 'border-4 border-ac-contorno bg-ac-fundo'
          : 'border-2 border-azul/30 bg-ceu shadow-suave'
      }`}
    >
      <Figura nome={figura} alt="" className="size-[72%]" />
    </button>
  )
}
