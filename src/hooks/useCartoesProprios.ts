import { useEffect, useState } from 'react'
import { observarCartoes } from '../lib/cartoes'
import type { CartaoProprio } from '../prancha/prancha'

/** Cartões próprios da professora, em tempo real. */
export function useCartoesProprios(uid: string) {
  const [cartoes, setCartoes] = useState<CartaoProprio[] | null>(null)
  useEffect(
    () =>
      observarCartoes(uid, setCartoes, (falha) => {
        console.error(falha)
        setCartoes([])
      }),
    [uid],
  )
  return cartoes
}
