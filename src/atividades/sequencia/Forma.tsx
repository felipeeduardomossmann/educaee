import { FORMAS, type NomeForma } from './formas'

const DESENHOS: Record<NomeForma, string> = {
  circulo: 'M50 8a42 42 0 1 1 0 84a42 42 0 1 1 0-84z',
  quadrado: 'M14 14h72v72H14z',
  triangulo: 'M50 10L92 88H8z',
  estrela:
    'M50 6l12.9 26.2 28.9 4.2-20.9 20.4 4.9 28.8L50 72l-25.8 13.6 4.9-28.8L8.2 36.4l28.9-4.2z',
  coracao: 'M50 88S8 62 8 34a20 20 0 0 1 42-10a20 20 0 0 1 42 10c0 28-42 54-42 54z',
}

export default function Forma({ nome, className }: { nome: NomeForma; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d={DESENHOS[nome]}
        fill={FORMAS[nome].cor}
        stroke="#1f2d3d"
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
