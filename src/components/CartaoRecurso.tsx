import { useId } from 'react'
import type { NomeFigura } from '../lib/figuras'
import BotaoLink from './BotaoLink'
import Figura from './Figura'

interface CartaoRecursoProps {
  figura: NomeFigura
  titulo: string
  texto: string
  para: string
  rotulo: string
  fundo: 'bg-lilas' | 'bg-ceu' | 'bg-menta' | 'bg-pessego'
}

/** Cartão do painel que leva a um recurso (Desenhos, Vídeos...). */
export default function CartaoRecurso({
  figura,
  titulo,
  texto,
  para,
  rotulo,
  fundo,
}: CartaoRecursoProps) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-wrap items-center gap-5 rounded-3xl border border-borda p-6 shadow-suave ${fundo}`}
    >
      <Figura nome={figura} alt="" className="size-16 shrink-0" />
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <h2 id={id} className="text-2xl font-extrabold">
          {titulo}
        </h2>
        <p className="text-tinta-suave">{texto}</p>
      </div>
      <BotaoLink to={para}>{rotulo}</BotaoLink>
    </section>
  )
}
