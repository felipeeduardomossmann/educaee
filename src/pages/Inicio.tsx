import { useSearchParams } from 'react-router'
import BotaoGoogle from '../components/BotaoGoogle'
import BotaoLink from '../components/BotaoLink'
import Card, { type CorCard } from '../components/Card'
import Figura from '../components/Figura'
import LayoutPublico from '../components/LayoutPublico'
import Logo from '../components/Logo'
import Mascote from '../components/Mascote'
import { useSessao } from '../contexts/sessao-contexto'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { NomeFigura } from '../lib/figuras'

const destaques: { titulo: string; texto: string; figura: NomeFigura; cor: CorCard }[] = [
  {
    titulo: 'Sem propaganda',
    texto: 'Nada para o aluno clicar sem querer.',
    figura: 'proibido',
    cor: 'pessego',
  },
  {
    titulo: 'Adapta-se a cada aluno',
    texto: 'Tamanho, sons, voz e figuras do jeito de cada um.',
    figura: 'quebra-cabeca',
    cor: 'lilas',
  },
  {
    titulo: 'Registra a evolução',
    texto: 'Histórico e relatório prontos para o plano de AEE.',
    figura: 'grafico',
    cor: 'menta',
  },
]

export default function Inicio() {
  useTituloPagina()
  const { usuario, carregando, entrando, entrar } = useSessao()
  const [parametros] = useSearchParams()
  const contaExcluida = parametros.has('conta-excluida')

  return (
    <LayoutPublico semLogo>
      {contaExcluida && (
        <p
          role="status"
          className="mx-auto mb-8 max-w-2xl rounded-2xl bg-menta px-5 py-4 text-center text-lg font-semibold"
        >
          Sua conta e todos os dados foram excluídos.
        </p>
      )}

      <section className="flex flex-col items-center gap-6 text-center">
        <Mascote className="size-32 sm:size-40" />
        <div className="flex flex-col gap-2">
          <h1>
            <Logo className="text-5xl sm:text-6xl" />
          </h1>
          <p className="text-xl font-semibold text-tinta-suave sm:text-2xl">
            Trilhando a sua evolução de maneira personalizada.
          </p>
        </div>
        <p className="max-w-2xl text-lg text-pretty">
          Atividades para o AEE que se adaptam a cada aluno. Gratuito e sem propaganda.
        </p>

        {/* Altura mínima reservada para os botões não "pularem" enquanto a sessão carrega. */}
        <div className="flex min-h-16 w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
          {carregando ? null : usuario ? (
            <BotaoLink to="/painel" tamanho="grande">
              Ir para meus alunos
            </BotaoLink>
          ) : (
            <>
              <BotaoGoogle tamanho="grande" disabled={entrando} onClick={() => void entrar()} />
              <BotaoLink to="/convidado" tamanho="grande">
                Usar sem conta
              </BotaoLink>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="titulo-destaques" className="mt-14">
        <h2 id="titulo-destaques" className="sr-only">
          Destaques
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {destaques.map((destaque) => (
            <li key={destaque.titulo}>
              <Card
                cor={destaque.cor}
                className="flex h-full flex-col items-center gap-3 text-center"
              >
                <Figura nome={destaque.figura} alt="" className="size-14" />
                <h3 className="text-lg font-extrabold">{destaque.titulo}</h3>
                <p className="text-tinta-suave">{destaque.texto}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </LayoutPublico>
  )
}
