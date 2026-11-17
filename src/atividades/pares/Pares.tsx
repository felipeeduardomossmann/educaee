import { TEMAS } from '../../lib/temas'
import JogoDaMemoria from '../memoria/JogoDaMemoria'
import type { PropsAtividade } from '../tipos'
import { criarJogoPares, instrucaoDoNivel } from './logica'

/** Pares que combinam: memória com pares associados (e figura–sombra no nível 4). */
export default function Pares(props: PropsAtividade) {
  return (
    <JogoDaMemoria
      {...props}
      instrucao={instrucaoDoNivel(props.nivel)}
      criar={() => criarJogoPares(props.nivel, TEMAS[props.tema].figuras)}
    />
  )
}
