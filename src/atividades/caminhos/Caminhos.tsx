import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { sortear } from '../../lib/aleatorio'
import { urlFigura, type NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import {
  ALTURA_QUADRO,
  avancar,
  CAMINHOS_POR_RODADA,
  instrucao,
  LARGURA_QUADRO,
  sortearCaminho,
  tolerancia,
  type Caminho,
  type Ponto,
} from './logica'

/** Distância entre os pontos amostrados do caminho (unidades do quadro). */
const PASSO = 6

interface Jogada {
  caminho: Caminho
  figura: NomeFigura
}

/** Caminhos: arrastar a figura até o fim. Sair do caminho não é erro. */
export default function Caminhos({
  nivel,
  perfil,
  tema,
  pausado,
  instruir,
  acertou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const novaJogada = (anterior: Jogada | null): Jogada => ({
    caminho: sortearCaminho(nivel, anterior?.caminho ?? null),
    figura: sortear(
      figuras.filter((f) => f !== anterior?.figura),
      1,
    )[0] as NomeFigura,
  })
  const [jogada, setJogada] = useState<Jogada>(() => novaJogada(null))
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [indice, setIndice] = useState(0)
  const arrastando = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => setJogada((atual) => novaJogada(atual)),
    total: CAMINHOS_POR_RODADA,
  })

  useEffect(() => {
    const { texto, fala } = instrucao(jogada.caminho)
    instruir(texto, fala)
  }, [jogada, instruir])

  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const larguraSvg = Math.max(0, Math.min(largura, (altura * LARGURA_QUADRO) / ALTURA_QUADRO))
  const temSvg = larguraSvg > 0

  // Amostra o caminho em pontos (a figura anda de ponto em ponto).
  useLayoutEffect(() => {
    const path = pathRef.current
    if (!path) return
    const total = path.getTotalLength()
    const lista: Ponto[] = []
    for (let l = 0; l <= total; l += PASSO) {
      const p = path.getPointAtLength(l)
      lista.push({ x: p.x, y: p.y })
    }
    const fim = path.getPointAtLength(total)
    lista.push({ x: fim.x, y: fim.y })
    setPontos(lista)
    setIndice(0)
    arrastando.current = false
    // O SVG só existe depois que a área é medida: recalcula quando ele aparece.
  }, [jogada.caminho.d, temSvg])

  const escala = larguraSvg / LARGURA_QUADRO
  const meiaLargura = tolerancia(nivel, aparencia.areaToque, escala)
  const ladoFigura = meiaLargura * 2.1
  const ultimo = Math.max(0, pontos.length - 1)
  const posicao = pontos[indice] ?? { x: 0, y: 0 }
  const fim = pontos[ultimo] ?? { x: 0, y: 0 }
  const chegou = pontos.length > 0 && indice >= ultimo - 1

  const irPara = (novo: number) => {
    if (pausado || emTransicao || chegou) return
    const destino = Math.min(ultimo, novo)
    if (destino <= indice) return
    setIndice(destino)
    if (destino >= ultimo - 1) acertar()
  }

  const paraQuadro = (evento: PointerEvent): Ponto | null => {
    const matriz = svgRef.current?.getScreenCTM()?.inverse()
    if (!matriz) return null
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz)
    return { x: p.x, y: p.y }
  }

  const aoPressionar = (evento: PointerEvent<SVGSVGElement>) => {
    if (pausado || emTransicao) return
    const p = paraQuadro(evento)
    if (!p) return
    // Começa a arrastar tocando perto da figura.
    if (Math.hypot(p.x - posicao.x, p.y - posicao.y) <= Math.max(ladoFigura, meiaLargura * 1.6)) {
      arrastando.current = true
      evento.currentTarget.setPointerCapture(evento.pointerId)
    }
  }

  const aoMover = (evento: PointerEvent<SVGSVGElement>) => {
    if (!arrastando.current) return
    const p = paraQuadro(evento)
    if (p) irPara(avancar(pontos, indice, p, meiaLargura))
  }

  const soltar = () => {
    arrastando.current = false
  }

  const alto = aparencia.altoContraste
  const cores = alto
    ? { trilho: '#232a36', guia: '#ffd84d', feito: '#ffffff', peca: '#0d1117', contorno: '#ffd84d' }
    : aparencia.escuro
      ? {
          trilho: '#1f3651',
          guia: '#adb9c6',
          feito: '#6fcf97',
          peca: '#1c2531',
          contorno: '#7fb3ea',
        }
      : {
          trilho: '#dcebfb',
          guia: '#4a5868',
          feito: '#2f7d4f',
          peca: '#ffffff',
          contorno: '#2b6cb0',
        }
  const letra = jogada.caminho.letra
  const porcentagem = ultimo > 0 ? Math.round((indice / ultimo) * 100) : 0

  return (
    <div ref={refArea} className="flex w-full flex-1 items-center justify-center">
      {larguraSvg > 0 && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LARGURA_QUADRO} ${ALTURA_QUADRO}`}
          width={larguraSvg}
          height={larguraSvg * (ALTURA_QUADRO / LARGURA_QUADRO)}
          className="touch-none select-none"
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          {/* Trilho largo (área de tolerância) */}
          <path
            d={jogada.caminho.d}
            fill="none"
            stroke={cores.trilho}
            strokeWidth={meiaLargura * 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Linha guia: tracejada nos caminhos, pontilhada nas letras */}
          <path
            ref={pathRef}
            d={jogada.caminho.d}
            fill="none"
            stroke={cores.guia}
            strokeWidth={letra ? 10 : 6}
            strokeLinecap="round"
            strokeDasharray={letra ? '0.1 26' : '18 18'}
          />
          {/* O trecho já percorrido */}
          {ultimo > 0 && (
            <path
              d={jogada.caminho.d}
              fill="none"
              stroke={cores.feito}
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={ultimo}
              strokeDasharray={`${indice} ${ultimo + 1}`}
            />
          )}
          {/* Destino: a casa (ou uma estrela no fim da letra) */}
          {pontos.length > 0 && (
            <image
              href={urlFigura(letra ? 'estrela' : 'casa')}
              x={fim.x - ladoFigura * 0.55}
              y={fim.y - ladoFigura * 0.55}
              width={ladoFigura * 1.1}
              height={ladoFigura * 1.1}
              opacity={chegou ? 1 : 0.85}
            />
          )}
          {/* A figura que anda (também dá para avançar com as setas do teclado) */}
          {pontos.length > 0 && (
            <g
              role="slider"
              tabIndex={0}
              aria-label="Figura no caminho. Use as setas para avançar."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentagem}
              onKeyDown={(evento) => {
                if (
                  ['ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowLeft', ' ', 'Enter'].includes(
                    evento.key,
                  )
                ) {
                  evento.preventDefault()
                  irPara(indice + Math.max(1, Math.round(ultimo / 12)))
                }
              }}
              className="cursor-grab outline-none focus-visible:[&>circle]:stroke-[12]"
            >
              <circle
                cx={posicao.x}
                cy={posicao.y}
                r={ladoFigura * 0.62}
                fill={cores.peca}
                stroke={cores.contorno}
                strokeWidth={6}
              />
              <image
                href={urlFigura(jogada.figura)}
                x={posicao.x - ladoFigura / 2}
                y={posicao.y - ladoFigura / 2}
                width={ladoFigura}
                height={ladoFigura}
              />
            </g>
          )}
        </svg>
      )}
    </div>
  )
}
