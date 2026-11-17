import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface MenuAcoesProps {
  /** Texto para leitores de tela, ex.: "Mais opções para Ana". */
  rotulo: string
  /** Itens do menu. Recebe a função que fecha o menu. */
  children: (fechar: () => void) => ReactNode
}

/** Botão discreto "⋯" que abre uma pequena lista de ações. Fecha com Esc ou tocando fora. */
export default function MenuAcoes({ rotulo, children }: MenuAcoesProps) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const idLista = useId()

  useEffect(() => {
    if (!aberto) return
    const aoTocarFora = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false)
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    document.addEventListener('pointerdown', aoTocarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoTocarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <div ref={raiz} className="relative">
      <button
        ref={botao}
        type="button"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex size-11 items-center justify-center rounded-xl text-2xl leading-none font-extrabold text-tinta-suave hover:bg-ceu hover:text-tinta"
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {aberto && (
        <div
          id={idLista}
          className="absolute top-12 right-0 z-30 flex min-w-40 flex-col gap-1 rounded-2xl border border-borda bg-white p-2 shadow-suave"
        >
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  )
}

/** Classe dos itens do MenuAcoes (links ou botões). */
export const classeItemMenu =
  'flex min-h-11 w-full items-center rounded-xl px-3 text-left font-bold hover:bg-ceu'
