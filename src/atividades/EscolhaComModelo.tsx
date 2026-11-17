import type { ReactNode } from 'react'
import type { Aparencia } from './aparencia'
import BotaoOpcao from './BotaoOpcao'
import { calcularGrade } from './grade'
import { useEspacoDisponivel } from './useEspacoDisponivel'

// Base das atividades "veja/ouça e toque na opção certa" (Emoções, Contar, Sombras, Sons...):
// um modelo opcional em cima e opções grandes embaixo, com as jogadas do motor.

const ESPACO = 16
const ESPACO_MODELO = 28

export interface OpcaoEscolha {
  chave: string
  /** Para leitores de tela. */
  rotulo: string
  conteudo: ReactNode
}

interface EscolhaComModeloProps {
  aparencia: Aparencia
  /** O que fica em cima (figura, grupo, palavra...). Sem modelo, só as opções. */
  modelo?: ReactNode
  rotuloModelo?: string
  /** Fração da altura para o modelo (padrão 0,32). */
  fracaoModelo?: number
  /** Modelo largo (ocupa a largura toda) em vez de quadrado. */
  modeloLargo?: boolean
  opcoes: readonly OpcaoEscolha[]
  /** Chave da resposta certa (marcada depois do acerto). */
  certa: string
  emTransicao: boolean
  /** Proporção largura/altura das opções (1 = quadradas; 2 = largas, para palavras). */
  proporcao?: number
  aoTocar: (chave: string) => void
}

export default function EscolhaComModelo({
  aparencia,
  modelo,
  rotuloModelo,
  fracaoModelo = 0.32,
  modeloLargo = false,
  opcoes,
  certa,
  emTransicao,
  proporcao = 1,
  aoTocar,
}: EscolhaComModeloProps) {
  const { ref, largura, altura } = useEspacoDisponivel<HTMLDivElement>()
  const temModelo = modelo !== undefined
  const alturaModelo = temModelo
    ? Math.round(Math.max(aparencia.areaToque, Math.min(260, altura * fracaoModelo)))
    : 0
  const grade = calcularGrade({
    quantidade: opcoes.length,
    largura: largura / proporcao,
    altura: altura - alturaModelo - (temModelo ? ESPACO_MODELO : 0),
    espaco: ESPACO,
    minimo: aparencia.areaToque,
    maximo: temModelo ? Math.max(alturaModelo, aparencia.areaToque) : 280,
  })
  const larguraOpcao = Math.round(grade.lado * proporcao)

  const caixaModelo = aparencia.altoContraste
    ? 'border-8 border-double border-ac-contorno bg-ac-fundo'
    : 'border-4 border-dashed border-azul/50 bg-sol'

  return (
    <div
      ref={ref}
      className="flex w-full flex-1 flex-col items-center justify-center"
      style={{ gap: ESPACO_MODELO }}
    >
      {temModelo && (
        <div
          role="img"
          aria-label={rotuloModelo}
          style={{
            height: alturaModelo,
            width: modeloLargo ? Math.min(largura, 900) : alturaModelo,
          }}
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-3xl ${caixaModelo}`}
        >
          {modelo}
        </div>
      )}
      {largura > 0 && (
        <div
          className="flex flex-wrap justify-center"
          style={{
            width: grade.colunas * larguraOpcao + (grade.colunas - 1) * ESPACO,
            gap: ESPACO,
          }}
        >
          {opcoes.map((opcao) => (
            <BotaoOpcao
              key={opcao.chave}
              aparencia={aparencia}
              rotulo={opcao.rotulo}
              largura={larguraOpcao}
              altura={grade.lado}
              certa={emTransicao && opcao.chave === certa}
              aoTocar={() => aoTocar(opcao.chave)}
            >
              {opcao.conteudo}
            </BotaoOpcao>
          ))}
        </div>
      )}
    </div>
  )
}
