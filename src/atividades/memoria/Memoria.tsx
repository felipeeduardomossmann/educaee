import { TEMAS } from '../../lib/temas'
import type { PropsAtividade } from '../tipos'
import JogoDaMemoria from './JogoDaMemoria'
import { criarJogo, INSTRUCAO, PARES_POR_NIVEL } from './logica'

/** Jogo da memória: pares de figuras iguais do tema. */
export default function Memoria(props: PropsAtividade) {
  return (
    <JogoDaMemoria
      {...props}
      instrucao={INSTRUCAO}
      criar={() => criarJogo(TEMAS[props.tema].figuras, PARES_POR_NIVEL[props.nivel] ?? 2)}
    />
  )
}
