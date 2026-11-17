import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { sortear } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'
import { TEMAS } from '../../lib/temas'
import { useAparencia } from '../aparencia'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import { INSTRUCAO, posicaoDoAlvo, progresso, TAMANHO_POR_NIVEL } from './logica'

interface Jogada {
  figura: NomeFigura
  posicao: { x: number; y: number }
}

/** Toque e segure: segurar até o anel encher. Soltar antes não é erro. */
export default function Segure({
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
  const nova = (anterior: Jogada | null): Jogada => ({
    figura: sortear(
      figuras.filter((f) => f !== anterior?.figura),
      1,
    )[0] as NomeFigura,
    posicao: posicaoDoAlvo(nivel),
  })
  const [jogada, setJogada] = useState<Jogada>(() => nova(null))
  const [cheio, setCheio] = useState(0)
  const [segurando, setSegurando] = useState(false)
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => {
      setJogada((atual) => nova(atual))
      setCheio(0)
    },
  })
  const { ref, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const lado = Math.max(
    aparencia.areaToque * 1.5,
    Math.min(320, Math.min(largura, altura) * (TAMANHO_POR_NIVEL[nivel] ?? 0.5)),
  )

  useEffect(() => {
    instruir(INSTRUCAO)
  }, [jogada, instruir])

  // Enquanto segura, o anel enche (para em pausa e entre jogadas).
  useEffect(() => {
    if (!segurando || pausado || emTransicao) return
    const comeco = performance.now()
    let quadro = 0
    const passo = () => {
      const p = progresso(performance.now() - comeco, nivel)
      setCheio(p)
      if (p >= 1) {
        setSegurando(false)
        acertar()
        return
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
    // `acertar` muda a cada renderização; o efeito só reinicia quando começa a segurar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segurando, pausado, emTransicao, nivel])

  const comecar = () => {
    if (pausado || emTransicao || segurando) return
    setSegurando(true)
  }
  const soltar = () => {
    if (!segurando) return
    setSegurando(false)
    if (!emTransicao) setCheio(0)
  }

  const raio = 46
  const volta = 2 * Math.PI * raio
  const alto = aparencia.altoContraste
  const livreX = Math.max(0, largura - lado)
  const livreY = Math.max(0, altura - lado)

  return (
    <div
      ref={ref}
      className="relative w-full flex-1 touch-none select-none"
      style={{ minHeight: lado }}
    >
      {largura > 0 && (
        <button
          type="button"
          aria-label={`${nomeLegivel(jogada.figura)}: segure até encher`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            comecar()
          }}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onLostPointerCapture={soltar}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              comecar()
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') soltar()
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: lado,
            height: lado,
            left: jogada.posicao.x * livreX,
            top: jogada.posicao.y * livreY,
          }}
          className={`absolute flex items-center justify-center rounded-full ${
            alto
              ? 'border-4 border-ac-contorno bg-ac-fundo'
              : 'border-2 border-azul/30 bg-ceu shadow-suave'
          }`}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={raio}
              fill="none"
              stroke={alto ? '#232a36' : aparencia.escuro ? '#364253' : '#ffffff'}
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r={raio}
              fill="none"
              stroke={alto ? '#ffd84d' : aparencia.escuro ? '#6fcf97' : '#2f7d4f'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${cheio * volta} ${volta}`}
            />
          </svg>
          <Figura nome={jogada.figura} alt="" className="pointer-events-none size-[62%]" />
          {emTransicao && (
            <span
              aria-hidden="true"
              className={`absolute top-1 right-1 flex size-10 items-center justify-center rounded-full text-xl font-extrabold ${
                alto ? 'bg-ac-texto text-ac-fundo' : 'bg-verde text-sobre-cor'
              }`}
            >
              ✓
            </span>
          )}
        </button>
      )}
    </div>
  )
}
