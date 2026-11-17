import { Link } from 'react-router'

const classeLink =
  'rounded-lg px-2 py-1 font-semibold text-tinta-suave underline-offset-4 hover:text-tinta hover:underline'

export default function Rodape() {
  return (
    <footer className="border-t border-borda print:hidden">
      <nav
        aria-label="Rodapé"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 py-6"
      >
        <Link to="/sobre" className={classeLink}>
          Sobre
        </Link>
        <span aria-hidden="true" className="text-tinta-suave">
          ·
        </span>
        <Link to="/privacidade" className={classeLink}>
          Privacidade
        </Link>
      </nav>
    </footer>
  )
}
