import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useAparencia } from '../../atividades/aparencia'
import { COMPONENTES_ATIVIDADE } from '../../atividades/componentes'
import type { DefinicaoAtividade } from '../../atividades/tipos'
import { Cronometro } from '../../lib/cronometro'
import type { Perfil } from '../../lib/perfil'
import type { ResultadoRodada } from '../../lib/sessoes'
import { tocarAcerto, tocarErro } from '../../lib/sons'
import { falar, pararFala } from '../../lib/voz'
import Botao from '../Botao'
import Figura from '../Figura'
import Modal from '../Modal'
import BotaoControle from './BotaoControle'

const TAMANHO_INSTRUCAO: Record<Perfil['tamanho'], string> = {
  normal: 'text-2xl sm:text-3xl',
  grande: 'text-3xl sm:text-4xl',
  muito_grande: 'text-4xl sm:text-5xl',
}

// Tempo do retorno na tela antes de sumir.
const DURACAO_ACERTO_MS = 900
const DURACAO_ERRO_MS = 1800
// Pausa curta depois da última jogada, para o retorno de acerto aparecer.
const ESPERA_FIM_MS = 900

type Retorno = 'acerto' | 'erro' | null

interface MotorAtividadeProps {
  definicao: DefinicaoAtividade
  nivel: number
  perfil: Perfil
  aoSair: () => void
  aoConcluir: (resultado: ResultadoRodada) => void
}

/** Tela de uma rodada: controles, instrução, a atividade, pausa e retornos de acerto/erro. */
export default function MotorAtividade({
  definicao,
  nivel,
  perfil,
  aoSair,
  aoConcluir,
}: MotorAtividadeProps) {
  const aparencia = useAparencia(perfil)
  const Atividade = COMPONENTES_ATIVIDADE[definicao.id]

  // texto: o que aparece na tela; fala: o que a voz diz (pode ser diferente, ex.: Letras).
  const [instrucao, setInstrucao] = useState({ texto: '', fala: '' })
  const [pausado, setPausado] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [retorno, setRetorno] = useState<Retorno>(null)
  const [concluida, setConcluida] = useState(false)

  const contagem = useRef({ acertos: 0, erros: 0 })
  const cronometro = useRef<Cronometro | null>(null)
  const temporizadorRetorno = useRef<number | undefined>(undefined)
  // Valores lidos dentro dos callbacks estáveis entregues à atividade.
  const atual = useRef({ perfil, parado: false })
  useEffect(() => {
    atual.current = { perfil, parado: pausado || confirmandoSaida }
  })

  useEffect(() => {
    cronometro.current = new Cronometro()
    return () => {
      pararFala()
      window.clearTimeout(temporizadorRetorno.current)
    }
  }, [])

  const mostrarRetorno = useCallback((tipo: Exclude<Retorno, null>) => {
    window.clearTimeout(temporizadorRetorno.current)
    setRetorno(tipo)
    temporizadorRetorno.current = window.setTimeout(
      () => setRetorno(null),
      tipo === 'acerto' ? DURACAO_ACERTO_MS : DURACAO_ERRO_MS,
    )
  }, [])

  const instruir = useCallback((texto: string, fala: string = texto) => {
    setInstrucao({ texto, fala })
    const { perfil: p, parado } = atual.current
    if (p.leituraVoz && !parado) void falar(fala, p.velocidadeVoz)
  }, [])

  const dizer = useCallback((fala: string) => {
    const { perfil: p, parado } = atual.current
    if (p.leituraVoz && !parado) void falar(fala, p.velocidadeVoz)
  }, [])

  const acertou = useCallback(() => {
    contagem.current.acertos += 1
    if (atual.current.perfil.sons) tocarAcerto()
    mostrarRetorno('acerto')
  }, [mostrarRetorno])

  const errou = useCallback(() => {
    contagem.current.erros += 1
    if (atual.current.perfil.sons) tocarErro()
    mostrarRetorno('erro')
  }, [mostrarRetorno])

  const concluir = useCallback(() => {
    setConcluida(true)
    cronometro.current?.pausar()
    const duracaoSeg = cronometro.current?.segundos() ?? 0
    window.setTimeout(() => {
      pararFala()
      aoConcluir({ ...contagem.current, duracaoSeg })
    }, ESPERA_FIM_MS)
  }, [aoConcluir])

  const pausar = () => {
    cronometro.current?.pausar()
    pararFala()
    setPausado(true)
  }

  const continuar = () => {
    setPausado(false)
    cronometro.current?.continuar()
    if (perfil.leituraVoz && instrucao.fala) void falar(instrucao.fala, perfil.velocidadeVoz)
  }

  const pedirSaida = () => {
    cronometro.current?.pausar()
    pararFala()
    setConfirmandoSaida(true)
  }

  const desistirDeSair = () => {
    setConfirmandoSaida(false)
    if (!pausado) cronometro.current?.continuar()
  }

  const parado = pausado || confirmandoSaida || concluida

  return (
    <div className={`flex min-h-dvh flex-col ${aparencia.classeTela}`}>
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
        <BotaoControle
          aparencia={aparencia}
          figura="porta"
          rotulo="Sair"
          onClick={pedirSaida}
          disabled={concluida}
        />
        <div className="flex gap-3">
          <BotaoControle
            aparencia={aparencia}
            figura="alto-falante"
            rotulo="Ouvir de novo"
            // Pedido explícito do adulto: fala mesmo com a leitura automática desligada.
            onClick={() => void falar(instrucao.fala, perfil.velocidadeVoz)}
            disabled={!instrucao.fala || parado}
          />
          <BotaoControle
            aparencia={aparencia}
            figura="pausar"
            rotulo="Pausar"
            onClick={pausar}
            disabled={parado}
          />
        </div>
      </div>

      <main className="flex flex-1 flex-col items-center gap-6 px-4 pb-8">
        <h1
          className={`max-w-4xl text-center font-extrabold ${TAMANHO_INSTRUCAO[perfil.tamanho]}`}
          aria-live="polite"
        >
          {instrucao.texto}
        </h1>
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          {Atividade ? (
            <Suspense fallback={<p className="text-xl font-semibold">Carregando…</p>}>
              <Atividade
                nivel={nivel}
                perfil={perfil}
                tema={perfil.tema}
                pausado={parado}
                instruir={instruir}
                dizer={dizer}
                acertou={acertou}
                errou={errou}
                concluir={concluir}
              />
            </Suspense>
          ) : (
            <p className="text-xl font-semibold">Esta atividade ainda está sendo construída.</p>
          )}
        </div>
      </main>

      {/* Retornos: o de acerto fica no centro, o de erro embaixo. Nenhum bloqueia o toque. */}
      <div aria-live="polite" className="sr-only">
        {retorno === 'acerto' ? 'Muito bem!' : retorno === 'erro' ? 'Quase! Tente de novo.' : ''}
      </div>
      {retorno === 'acerto' && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <Figura
            nome="estrela-brilhante"
            alt=""
            className={`size-32 drop-shadow-lg sm:size-40 ${aparencia.animacoesReduzidas ? '' : 'animate-surgir'}`}
          />
        </div>
      )}
      {retorno === 'erro' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
          <p
            className={`rounded-full px-6 py-3 text-2xl font-extrabold shadow-suave ${
              aparencia.altoContraste
                ? 'border-4 border-ac-contorno bg-ac-fundo text-ac-texto'
                : 'bg-sol text-tinta'
            }`}
          >
            Quase! Tente de novo
          </p>
        </div>
      )}

      <Modal
        aberto={pausado}
        titulo="Pausado"
        aoFechar={continuar}
        acoes={
          <Botao tamanho="grande" onClick={continuar} autoFocus>
            <Figura nome="continuar" alt="" className="size-7" />
            Continuar
          </Botao>
        }
      >
        <p>O tempo da rodada está parado. Continue quando quiser.</p>
      </Modal>

      <Modal
        aberto={confirmandoSaida}
        titulo="Sair da atividade?"
        aoFechar={desistirDeSair}
        acoes={
          <>
            <Botao variante="secundario" tamanho="grande" onClick={aoSair}>
              Sair
            </Botao>
            <Botao tamanho="grande" onClick={desistirDeSair} autoFocus>
              Continuar jogando
            </Botao>
          </>
        }
      >
        <p>Esta rodada ainda não terminou e não será salva.</p>
      </Modal>
    </div>
  )
}
