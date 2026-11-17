import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useSessao } from '../contexts/sessao-contexto'
import FaixaConvidado from './FaixaConvidado'
import Logo from './Logo'
import PularParaConteudo from './PularParaConteudo'
import SeletorTema from './SeletorTema'

/** Estrutura das telas do modo convidado: faixa fixa no topo avisando que nada é salvo. */
export default function LayoutConvidado({ children }: { children: ReactNode }) {
  const { entrar } = useSessao()

  return (
    <div className="flex min-h-dvh flex-col">
      <PularParaConteudo />
      <FaixaConvidado aoEntrar={() => void entrar()} />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <Link to="/" className="inline-block rounded-xl px-1" aria-label="EducAEE – página inicial">
          <Logo />
        </Link>
        <SeletorTema />
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
