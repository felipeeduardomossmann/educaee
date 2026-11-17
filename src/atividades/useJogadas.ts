import { useEffect, useRef, useState } from 'react'
import { JOGADAS_POR_RODADA } from './tipos'

// Pausa depois de um acerto, para o retorno aparecer antes da próxima jogada.
const ESPERA_ENTRE_JOGADAS_MS = 1000

interface OpcoesJogadas {
  acertou: () => void
  concluir: () => void
  /** Prepara a próxima jogada (sorteia o novo desafio). */
  aoAvancar: () => void
  total?: number
}

/** Jogadas da rodada: ao acertar, espera um pouco e passa para a próxima. */
export function useJogadas({
  acertou,
  concluir,
  aoAvancar,
  total = JOGADAS_POR_RODADA,
}: OpcoesJogadas) {
  const [jogada, setJogada] = useState(1)
  const [emTransicao, setEmTransicao] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const acertar = () => {
    if (emTransicao) return
    acertou()
    setEmTransicao(true)
    if (jogada >= total) {
      concluir()
      return
    }
    temporizador.current = window.setTimeout(() => {
      aoAvancar()
      setJogada((atual) => atual + 1)
      setEmTransicao(false)
    }, ESPERA_ENTRE_JOGADAS_MS)
  }

  return { jogada, total, emTransicao, acertar }
}
