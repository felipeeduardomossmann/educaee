import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useSessao } from '../contexts/sessao-contexto'
import FotoUsuario from './FotoUsuario'
import Logo from './Logo'
import PularParaConteudo from './PularParaConteudo'
import SeletorTema from './SeletorTema'
import Rodape from './Rodape'

const classeNav = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold ${
    isActive ? 'bg-ceu text-tinta' : 'text-tinta-suave hover:bg-ceu hover:text-tinta'
  }`

/** Estrutura das telas da professora: cabeçalho com navegação, conteúdo e rodapé. */
export default function LayoutLogado({ children }: { children: ReactNode }) {
  const { usuario } = useSessao()

  return (
    <div className="flex min-h-dvh flex-col">
      <PularParaConteudo />

      <header className="border-b border-borda bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link to="/painel" className="rounded-xl px-1" aria-label="EducAEE – meus alunos">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
            <NavLink to="/painel" end className={classeNav}>
              Meus alunos
            </NavLink>
            <NavLink to="/desenhos" className={classeNav}>
              Desenhos
            </NavLink>
            <NavLink to="/videos" className={classeNav}>
              Vídeos
            </NavLink>
            <NavLink to="/prancha" className={classeNav}>
              Prancha
            </NavLink>
            <NavLink to="/conta" className={classeNav}>
              {usuario && <FotoUsuario usuario={usuario} className="size-7" />}
              Minha conta
            </NavLink>
            <SeletorTema />
          </nav>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      <Rodape />
    </div>
  )
}
