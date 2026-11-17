import { Link, type LinkProps } from 'react-router'
import { classesBotao, type TamanhoBotao, type VarianteBotao } from './estilos-botao'

interface BotaoLinkProps extends LinkProps {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
}

/** Link com aparência de botão (para navegação entre telas). */
export default function BotaoLink({ variante, tamanho, className, ...props }: BotaoLinkProps) {
  return <Link className={classesBotao(variante, tamanho, className)} {...props} />
}
