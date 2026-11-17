import type { ButtonHTMLAttributes } from 'react'
import { classesBotao, type TamanhoBotao, type VarianteBotao } from './estilos-botao'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
}

export default function Botao({
  variante,
  tamanho,
  className,
  type = 'button',
  ...props
}: BotaoProps) {
  return <button type={type} className={classesBotao(variante, tamanho, className)} {...props} />
}
