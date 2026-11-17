import BotaoLink from '../components/BotaoLink'
import Figura from '../components/Figura'
import LayoutPublico from '../components/LayoutPublico'
import { useTituloPagina } from '../hooks/useTituloPagina'

export default function NaoEncontrada() {
  useTituloPagina('Página não encontrada')

  return (
    <LayoutPublico>
      <section className="flex flex-col items-center gap-6 py-8 text-center">
        <Figura nome="telescopio" alt="" className="size-28" />
        <h1 className="text-4xl font-extrabold">Ops! Não achamos esta página.</h1>
        <p className="max-w-xl text-lg text-tinta-suave">
          Procuramos por todo lado, mas o endereço não existe ou mudou de lugar.
        </p>
        <BotaoLink to="/" tamanho="grande">
          Voltar para o início
        </BotaoLink>
      </section>
    </LayoutPublico>
  )
}
