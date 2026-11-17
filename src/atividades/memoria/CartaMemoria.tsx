import Figura from '../../components/Figura'
import type { NomeFigura } from '../../lib/figuras'
import type { Aparencia } from '../aparencia'
import { nomeLegivel } from '../nomes'

interface CartaMemoriaProps {
  numero: number
  figura: NomeFigura
  /** Mostra a figura como sombra (silhueta). */
  sombra?: boolean
  aberta: boolean
  encontrada: boolean
  lado: number
  aparencia: Aparencia
  aoTocar: () => void
}

/** Uma carta: verso com "?" e frente com a figura. Vira em 3D (instantâneo se reduzido). */
export default function CartaMemoria({
  numero,
  figura,
  sombra = false,
  aberta,
  encontrada,
  lado,
  aparencia,
  aoTocar,
}: CartaMemoriaProps) {
  const alto = aparencia.altoContraste
  const nome = sombra ? `sombra de ${nomeLegivel(figura)}` : nomeLegivel(figura)
  const rotulo = encontrada
    ? `Carta ${numero}: ${nome}, par encontrado`
    : aberta
      ? `Carta ${numero}: ${nome}`
      : `Carta ${numero}, virada para baixo`

  const faceBase = 'absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden'

  return (
    <button
      type="button"
      aria-label={rotulo}
      aria-disabled={encontrada || undefined}
      // No Chrome, o click é um PointerEvent: vale igual para mouse, toque e teclado.
      onClick={aoTocar}
      style={{ width: lado, height: lado }}
      className="relative touch-manipulation rounded-2xl select-none perspective-[800px]"
    >
      <span
        className={`absolute inset-0 transform-3d ${
          aparencia.animacoesReduzidas ? '' : 'transition-transform duration-300 ease-out'
        } ${aberta || encontrada ? 'rotate-y-180' : ''}`}
      >
        {/* Verso */}
        <span
          className={`${faceBase} ${
            alto
              ? 'border-4 border-ac-contorno bg-ac-fundo text-ac-contorno'
              : 'border-2 border-azul/30 bg-ceu text-azul-escuro shadow-suave'
          }`}
        >
          <span aria-hidden="true" className="font-extrabold" style={{ fontSize: lado * 0.45 }}>
            ?
          </span>
        </span>
        {/* Frente */}
        <span
          className={`${faceBase} rotate-y-180 ${
            alto
              ? `border-4 bg-ac-fundo ${encontrada ? 'border-ac-texto' : 'border-ac-contorno'}`
              : `border-2 shadow-suave ${encontrada ? 'border-verde/40 bg-menta' : 'border-borda bg-white'}`
          }`}
        >
          <Figura
            nome={figura}
            alt=""
            className={`size-[70%] ${sombra ? (alto ? 'brightness-0 invert' : 'silhueta') : ''}`}
          />
          {encontrada && (
            // Marca de par encontrado: não depende só da cor.
            <span
              aria-hidden="true"
              className={`absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full text-base font-extrabold ${
                alto ? 'bg-ac-texto text-ac-fundo' : 'bg-verde text-sobre-cor'
              }`}
            >
              ✓
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
