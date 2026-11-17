import type { CSSProperties, ReactNode } from 'react'
import type { Aparencia } from './aparencia'

interface BotaoOpcaoProps {
  aparencia: Aparencia
  /** Texto para leitores de tela (ex.: o nome da figura ou a letra). */
  rotulo: string
  aoTocar: () => void
  /** Marca a resposta certa depois do acerto (contorno e ✓, não só cor). */
  certa?: boolean
  largura: number
  altura?: number
  style?: CSSProperties
  children: ReactNode
}

/** Opção de resposta grande (figura, letra, sílaba ou palavra). */
export default function BotaoOpcao({
  aparencia,
  rotulo,
  aoTocar,
  certa = false,
  largura,
  altura = largura,
  style,
  children,
}: BotaoOpcaoProps) {
  const alto = aparencia.altoContraste
  const destaque = certa
    ? alto
      ? 'border-ac-texto! border-8!'
      : 'border-verde! border-4! bg-menta!'
    : ''

  return (
    <button
      type="button"
      aria-label={rotulo}
      // No Chrome, o click é um PointerEvent: vale igual para mouse, toque e teclado.
      onClick={aoTocar}
      style={{ width: largura, height: altura, ...style }}
      className={`relative flex touch-manipulation items-center justify-center select-none ${aparencia.classeAlvo} ${destaque} ${
        alto ? '' : 'hover:border-azul'
      }`}
    >
      {children}
      {certa && (
        <span
          aria-hidden="true"
          className={`absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full text-lg font-extrabold ${
            alto ? 'bg-ac-texto text-ac-fundo' : 'bg-verde text-sobre-cor'
          }`}
        >
          ✓
        </span>
      )}
    </button>
  )
}
