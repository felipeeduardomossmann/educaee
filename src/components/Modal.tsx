import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
  /** Botões de ação, mostrados no rodapé do modal. */
  acoes?: ReactNode
  /** false impede fechar com Esc ou tocando fora (ex.: durante uma exclusão). */
  podeFechar?: boolean
  /** Modal mais largo, para conteúdos longos (ex.: ajustes do perfil). */
  largo?: boolean
}

/** Diálogo baseado no <dialog> nativo (foco preso, Esc fecha). */
export default function Modal({
  aberto,
  titulo,
  aoFechar,
  children,
  acoes,
  podeFechar = true,
  largo = false,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        // Esc: o estado decide se fecha; o <dialog> não fecha sozinho.
        evento.preventDefault()
        if (podeFechar) aoFechar()
      }}
      onClick={(evento) => {
        // Toque no fundo escurecido fecha o modal.
        if (evento.target === ref.current && podeFechar) aoFechar()
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-0 text-tinta shadow-suave backdrop:bg-tinta/40 ${
        largo ? 'w-[min(56rem,calc(100%-2rem))]' : 'w-[min(32rem,calc(100%-2rem))]'
      }`}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={idTitulo} className="text-2xl font-extrabold">
          {titulo}
        </h2>
        <div className="text-lg">{children}</div>
        {acoes && <div className="mt-2 flex flex-wrap justify-end gap-3">{acoes}</div>}
      </div>
    </dialog>
  )
}
