import { AREA_TOQUE, type Perfil } from '../lib/perfil'
import { TEMAS } from '../lib/temas'
import Figura from './Figura'

const TAMANHO_TEXTO: Record<Perfil['tamanho'], string> = {
  normal: 'text-xl',
  grande: 'text-2xl',
  muito_grande: 'text-3xl',
}

/** Amostra de como as atividades vão aparecer: tamanho real dos alvos, contraste e tema. */
export default function PreviaPerfil({ perfil }: { perfil: Perfil }) {
  const alto = perfil.contraste === 'alto'
  const lado = AREA_TOQUE[perfil.tamanho]
  const figuras = TEMAS[perfil.tema].figuras.slice(0, 3)

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-bold text-tinta-suave">Prévia</figcaption>
      <div
        aria-hidden="true"
        className={`flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-5 ${
          alto ? 'bg-ac-fundo text-ac-texto' : 'border border-borda bg-white text-tinta'
        }`}
      >
        <p className={`font-extrabold ${TAMANHO_TEXTO[perfil.tamanho]}`}>Toque no igual</p>
        <div className="flex flex-wrap justify-center gap-3">
          {figuras.map((figura) => (
            <div
              key={figura}
              style={{ width: lado, height: lado }}
              className={`flex items-center justify-center rounded-2xl ${
                alto ? 'border-4 border-ac-contorno bg-ac-fundo' : 'bg-ceu shadow-suave'
              }`}
            >
              <Figura nome={figura} alt="" className="size-[65%]" />
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-tinta-suave">
        Alvos com {lado} px, o tamanho real nas atividades.
      </p>
    </figure>
  )
}
