import { useEffect, useState } from 'react'
import Figura from '../../components/Figura'
import { TEMAS } from '../../lib/temas'
import { useAparencia, type Aparencia } from '../aparencia'
import BotaoOpcao from '../BotaoOpcao'
import { nomeLegivel } from '../nomes'
import type { PropsAtividade } from '../tipos'
import { useEspacoDisponivel } from '../useEspacoDisponivel'
import { useJogadas } from '../useJogadas'
import Forma from './Forma'
import { FORMAS } from './formas'
import {
  chaveItem,
  criarDesafio,
  OPCOES,
  type DesafioSequencia,
  type ItemSequencia,
  INSTRUCAO,
} from './logica'

const ESPACO_SEQUENCIA = 10
const ESPACO_OPCOES = 16
const ESPACO_ENTRE_PARTES = 40
const LADO_SEQUENCIA_MIN = 48
const LADO_SEQUENCIA_MAX = 110
const LADO_OPCAO_MAX = 180

function rotuloItem(item: ItemSequencia): string {
  return item.tipo === 'forma' ? FORMAS[item.forma].rotulo : nomeLegivel(item.figura)
}

function DesenhoItem({ item }: { item: ItemSequencia }) {
  return item.tipo === 'forma' ? (
    <Forma nome={item.forma} className="size-[70%]" />
  ) : (
    <Figura nome={item.figura} alt="" className="size-[72%]" />
  )
}

/** Tamanho dos itens da sequência: todos numa linha se der; senão, quebra em mais linhas. */
function medirSequencia(quantidade: number, largura: number) {
  const ladoNumaLinha = (largura - ESPACO_SEQUENCIA * (quantidade - 1)) / quantidade
  const lado = Math.floor(Math.min(LADO_SEQUENCIA_MAX, Math.max(LADO_SEQUENCIA_MIN, ladoNumaLinha)))
  const porLinha = Math.max(1, Math.floor((largura + ESPACO_SEQUENCIA) / (lado + ESPACO_SEQUENCIA)))
  const linhas = Math.ceil(quantidade / porLinha)
  return { lado, altura: linhas * lado + (linhas - 1) * ESPACO_SEQUENCIA }
}

function classeQuadro(aparencia: Aparencia) {
  return aparencia.altoContraste
    ? 'rounded-2xl border-4 border-ac-contorno bg-ac-fundo'
    : 'rounded-2xl border-2 border-borda bg-white shadow-suave'
}

/** Complete a sequência: escolher o que vem depois entre 3 opções. */
export default function Sequencia({
  nivel,
  perfil,
  tema,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const aparencia = useAparencia(perfil)
  const figuras = TEMAS[tema].figuras
  const [desafio, setDesafio] = useState<DesafioSequencia>(() => criarDesafio(nivel, figuras))
  const { emTransicao, acertar } = useJogadas({
    acertou,
    concluir,
    aoAvancar: () => setDesafio(criarDesafio(nivel, figuras)),
  })

  const { ref: refArea, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  // A sequência mais o espaço vazio.
  const sequencia = medirSequencia(desafio.sequencia.length + 1, largura)
  const ladoOpcao = Math.floor(
    Math.max(
      aparencia.areaToque,
      Math.min(
        LADO_OPCAO_MAX,
        (largura - ESPACO_OPCOES * (OPCOES - 1)) / OPCOES,
        altura - sequencia.altura - ESPACO_ENTRE_PARTES,
      ),
    ),
  )

  useEffect(() => {
    instruir(INSTRUCAO)
  }, [desafio, instruir])

  const tocar = (item: ItemSequencia) => {
    if (pausado || emTransicao) return
    if (chaveItem(item) === chaveItem(desafio.resposta)) acertar()
    else errou()
  }

  const quadro = classeQuadro(aparencia)

  return (
    <div
      ref={refArea}
      className="flex w-full flex-1 flex-col items-center justify-center"
      style={{ gap: ESPACO_ENTRE_PARTES }}
    >
      {largura > 0 && (
        <>
          <ol
            aria-label="Sequência"
            className="flex flex-wrap justify-center"
            style={{ gap: ESPACO_SEQUENCIA }}
          >
            {desafio.sequencia.map((item, indice) => (
              <li
                // A sequência não muda durante a jogada: o índice serve de chave.
                key={indice}
                aria-label={rotuloItem(item)}
                style={{ width: sequencia.lado, height: sequencia.lado }}
                className={`flex items-center justify-center ${quadro}`}
              >
                <DesenhoItem item={item} />
              </li>
            ))}
            <li
              aria-label={emTransicao ? rotuloItem(desafio.resposta) : 'Espaço vazio'}
              style={{ width: sequencia.lado, height: sequencia.lado }}
              className={`flex items-center justify-center rounded-2xl border-4 border-dashed ${
                aparencia.altoContraste ? 'border-ac-contorno' : 'border-azul/60 bg-sol'
              }`}
            >
              {emTransicao ? (
                <DesenhoItem item={desafio.resposta} />
              ) : (
                <span
                  aria-hidden="true"
                  className="font-extrabold"
                  style={{ fontSize: sequencia.lado * 0.5 }}
                >
                  ?
                </span>
              )}
            </li>
          </ol>

          <div className="flex flex-wrap justify-center" style={{ gap: ESPACO_OPCOES }}>
            {desafio.opcoes.map((item) => (
              <BotaoOpcao
                key={chaveItem(item)}
                aparencia={aparencia}
                rotulo={rotuloItem(item)}
                largura={ladoOpcao}
                certa={emTransicao && chaveItem(item) === chaveItem(desafio.resposta)}
                aoTocar={() => tocar(item)}
              >
                <DesenhoItem item={item} />
              </BotaoOpcao>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
