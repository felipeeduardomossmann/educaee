import { useEffect, useState } from 'react'
import type { PropsAtividade } from './tipos'
import { useJogadas } from './useJogadas'

export interface Instrucao {
  texto: string
  /** O que a voz fala, se diferente do texto. */
  fala?: string
}

/** Sorteia um desafio por jogada (`criar` recebe o anterior, para não repetir). */
export function useDesafios<D>(
  props: Pick<PropsAtividade, 'instruir' | 'acertou' | 'concluir'>,
  criar: (anterior: D | null) => D,
  instrucaoDe: (desafio: D) => Instrucao,
  total?: number,
) {
  const [desafio, setDesafio] = useState<D>(() => criar(null))
  const jogadas = useJogadas({
    acertou: props.acertou,
    concluir: props.concluir,
    aoAvancar: () => setDesafio((atual) => criar(atual)),
    total,
  })
  const { instruir } = props
  useEffect(() => {
    const { texto, fala } = instrucaoDe(desafio)
    instruir(texto, fala)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desafio, instruir])
  return { desafio, ...jogadas }
}
