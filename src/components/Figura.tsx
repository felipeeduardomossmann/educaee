import { urlFigura, type NomeFigura } from '../lib/figuras'

interface FiguraProps {
  nome: NomeFigura
  /** Descrição para leitores de tela. Use "" quando a figura for só decorativa. */
  alt: string
  className?: string
}

export default function Figura({ nome, alt, className = 'size-12' }: FiguraProps) {
  return (
    <img
      src={urlFigura(nome)}
      alt={alt}
      className={className}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  )
}
