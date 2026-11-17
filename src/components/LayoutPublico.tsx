import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Logo from './Logo'
import PularParaConteudo from './PularParaConteudo'
import SeletorTema from './SeletorTema'
import Rodape from './Rodape'

interface LayoutPublicoProps {
  children: ReactNode
  /** Esconde o logo do cabeçalho (a página inicial já mostra o logo grande). */
  semLogo?: boolean
}

/** Estrutura das páginas públicas: cabeçalho, conteúdo e rodapé. */
export default function LayoutPublico({ children, semLogo = false }: LayoutPublicoProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PularParaConteudo />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        {semLogo ? (
          <span />
        ) : (
          <Link
            to="/"
            className="inline-block rounded-xl px-1"
            aria-label="EducAEE – página inicial"
          >
            <Logo />
          </Link>
        )}
        <SeletorTema />
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      <Rodape />
    </div>
  )
}
