import { useId } from 'react'
import { useSessao } from '../contexts/sessao-contexto'
import type { NomeFigura } from '../lib/figuras'
import BotaoGoogle from './BotaoGoogle'
import Figura from './Figura'

/** Recurso só para quem entra: no modo convidado aparece bloqueado, com o botão de entrar. */
export default function RecursoBloqueado({
  figura,
  titulo,
}: {
  figura: NomeFigura
  titulo: string
}) {
  const id = useId()
  const { entrar, entrando } = useSessao()
  return (
    <section
      aria-labelledby={id}
      className="flex flex-wrap items-center gap-5 rounded-3xl border-2 border-dashed border-borda bg-white p-6"
    >
      <div className="relative shrink-0">
        <Figura nome={figura} alt="" className="size-16 opacity-60" />
        <Figura nome="cadeado" alt="" className="absolute -right-2 -bottom-2 size-8" />
      </div>
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <h2 id={id} className="text-2xl font-extrabold">
          {titulo}
        </h2>
        <p className="font-semibold text-tinta-suave">Entre com Google para usar.</p>
      </div>
      <BotaoGoogle disabled={entrando} onClick={() => void entrar()} />
    </section>
  )
}
