import { useEffect, useState } from 'react'
import { useAparencia } from '../aparencia'
import { calcularGrade } from '../grade'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import CartaMemoria from './CartaMemoria'
import {
  desvirar,
  ESPIAR_MS,
  FALA_ESPIAR,
  falaDaCarta,
  NIVEIS_ESPIAR,
  tocarCarta,
  type EstadoMemoria,
} from './logica'

const ESPACO_ENTRE_CARTAS = 12
const LADO_MAXIMO = 220
// Tempo que um par diferente fica aberto antes de desvirar sozinho.
const ESPERA_DESVIRAR_MS = 1500
const ALTURA_AVISO = 48

interface JogoDaMemoriaProps extends PropsAtividade {
  criar: () => EstadoMemoria
  instrucao: string
}

/** Tabuleiro de memória (Memória e Pares). Rodada = completar o tabuleiro. */
export default function JogoDaMemoria({
  nivel,
  perfil,
  pausado,
  instruir,
  dizer,
  acertou,
  errou,
  concluir,
  criar,
  instrucao,
}: JogoDaMemoriaProps) {
  const aparencia = useAparencia(perfil)
  const { animacoesReduzidas } = aparencia
  const [estado, setEstado] = useState(criar)
  const [espiando, setEspiando] = useState(() => NIVEIS_ESPIAR.includes(nivel))
  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const grade = calcularGrade({
    quantidade: estado.cartas.length,
    largura,
    // Com animações reduzidas, reserva lugar para o aviso "toque para virar de volta".
    altura: altura - (animacoesReduzidas ? ALTURA_AVISO : 0),
    espaco: ESPACO_ENTRE_CARTAS,
    minimo: aparencia.areaToque,
    maximo: LADO_MAXIMO,
  })

  useEffect(() => {
    instruir(espiando ? FALA_ESPIAR : instrucao)
  }, [instruir, instrucao, espiando])

  // Espiar: as cartas ficam abertas; o tempo para enquanto a atividade está pausada.
  useEffect(() => {
    if (!espiando || pausado) return
    const temporizador = window.setTimeout(() => setEspiando(false), ESPIAR_MS)
    return () => window.clearTimeout(temporizador)
  }, [espiando, pausado])

  useEffect(() => {
    if (!estado.aguardandoDesvirar || animacoesReduzidas) return
    const temporizador = window.setTimeout(() => setEstado(desvirar), ESPERA_DESVIRAR_MS)
    return () => window.clearTimeout(temporizador)
  }, [estado.aguardandoDesvirar, animacoesReduzidas])

  const tocar = (indice: number) => {
    if (pausado || espiando) return
    if (estado.aguardandoDesvirar) {
      // Animações reduzidas: o toque seguinte desvira as cartas (e não vira outra).
      if (animacoesReduzidas) setEstado(desvirar(estado))
      return
    }
    const { estado: novo, evento } = tocarCarta(estado, indice)
    setEstado(novo)
    const carta = estado.cartas[indice]
    if (evento !== 'nada' && carta) dizer(falaDaCarta(carta))
    if (evento === 'par') acertou()
    if (evento === 'erro') errou()
    if (evento === 'fim') {
      acertou()
      concluir()
    }
  }

  return (
    // Ocupa toda a área de jogo (topo fixo), para a medição do espaço não oscilar.
    <div ref={refArea} className="flex w-full flex-1 flex-col items-center justify-center gap-4">
      {largura > 0 && (
        <div
          // Linhas que quebram com largura exata de N colunas: a última linha fica centralizada.
          className="flex flex-wrap justify-center"
          style={{
            width: grade.colunas * grade.lado + (grade.colunas - 1) * ESPACO_ENTRE_CARTAS,
            gap: ESPACO_ENTRE_CARTAS,
          }}
        >
          {estado.cartas.map((carta, indice) => (
            <CartaMemoria
              // A posição da carta não muda durante a rodada: o índice serve de chave.
              key={indice}
              numero={indice + 1}
              figura={carta.figura}
              sombra={carta.sombra}
              aberta={espiando || estado.viradas.includes(indice)}
              encontrada={carta.encontrada}
              lado={grade.lado}
              aparencia={aparencia}
              aoTocar={() => tocar(indice)}
            />
          ))}
        </div>
      )}
      {animacoesReduzidas && (
        <p className="flex min-h-8 items-center text-xl font-bold">
          {estado.aguardandoDesvirar ? 'Toque em qualquer carta para virar de volta.' : ''}
        </p>
      )}
    </div>
  )
}
