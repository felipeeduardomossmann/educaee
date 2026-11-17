import type { ButtonHTMLAttributes } from 'react'
import type { Aparencia } from '../../atividades/aparencia'
import type { NomeFigura } from '../../lib/figuras'
import Figura from '../Figura'

interface BotaoControleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  aparencia: Aparencia
  figura: NomeFigura
  rotulo: string
}

/** Controle fixo da atividade (Sair, Ouvir de novo, Pausar): grande, com figura e texto. */
export default function BotaoControle({
  aparencia,
  figura,
  rotulo,
  className = '',
  ...props
}: BotaoControleProps) {
  return (
    <button
      type="button"
      style={{
        minHeight: aparencia.areaToque,
        // Em telas estreitas, os 3 controles precisam caber lado a lado (sem rolar para o lado).
        minWidth: `min(${aparencia.areaToque}px, calc((100vw - 56px) / 3))`,
      }}
      className={`inline-flex items-center justify-center gap-2 px-3 text-lg font-extrabold disabled:opacity-40 sm:px-5 ${aparencia.classeAlvo} ${className}`}
      {...props}
    >
      <Figura nome={figura} alt="" className="size-8 shrink-0" />
      {/* Em telas estreitas fica só a figura; o nome continua para leitores de tela. */}
      <span className="sr-only sm:not-sr-only">{rotulo}</span>
    </button>
  )
}
