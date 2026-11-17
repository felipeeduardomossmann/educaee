import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAparencia } from '../../atividades/aparencia'
import type { DefinicaoAtividade } from '../../atividades/tipos'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import type { Perfil } from '../../lib/perfil'
import type { ResultadoRodada } from '../../lib/sessoes'
import { avaliarSugestao, type Sugestao } from '../../lib/sugestao'
import Botao from '../Botao'
import Figura from '../Figura'
import type { FonteJogo } from './fonte'
import MotorAtividade from './MotorAtividade'
import SugestaoNivel, { type RespostaSugestao } from './SugestaoNivel'
import TelaResultado, { type Salvamento } from './TelaResultado'

type Fase = { tipo: 'jogando'; rodada: number } | { tipo: 'resultado'; resultado: ResultadoRodada }

interface JogoProps {
  definicao: DefinicaoAtividade
  /** Nível escolhido na tela de escolha (pode mudar se a sugestão for aceita). */
  nivel: number
  perfil: Perfil
  /** Nome do aluno, ou null no modo convidado. */
  nomeAluno: string | null
  /** Para onde voltar (escolha de atividade). */
  telaEscolha: string
  fonte: FonteJogo
  /** Quando é uma etapa da trilha do dia: marca a etapa ao concluir uma rodada. */
  trilha?: { aoConcluir: () => void }
}

/** Uma atividade do começo ao fim: aviso de voz (se preciso), rodadas, resultado e sugestão. */
export default function Jogo({
  definicao,
  nivel: nivelInicial,
  perfil,
  nomeAluno,
  telaEscolha,
  fonte,
  trilha,
}: JogoProps) {
  useTituloPagina(definicao.nome)
  const navigate = useNavigate()
  const [nivel, setNivel] = useState(nivelInicial)
  const [fase, setFase] = useState<Fase>({ tipo: 'jogando', rodada: 1 })
  const [salvamento, setSalvamento] = useState<Salvamento>('sem-conta')
  const [sugestao, setSugestao] = useState<(Sugestao & { resposta: RespostaSugestao }) | null>(null)
  // "Ligar só para esta atividade": vale até sair dela, sem mudar o perfil salvo.
  const [vozSoAqui, setVozSoAqui] = useState(false)
  const perfilEmUso = vozSoAqui ? { ...perfil, leituraVoz: true } : perfil
  const aparencia = useAparencia(perfilEmUso)

  // A fonte muda a cada renderização (ex.: o nível atual chega do banco); lida na hora do uso.
  const fonteAtual = useRef(fonte)
  useEffect(() => {
    fonteAtual.current = fonte
  })
  const trilhaAtual = useRef(trilha)
  useEffect(() => {
    trilhaAtual.current = trilha
  })
  // Identifica a rodada: uma sugestão que chega atrasada não aparece em outra rodada.
  const rodadaAtual = useRef(0)

  const voltar = useCallback(() => void navigate(telaEscolha), [navigate, telaEscolha])

  const aoConcluir = useCallback(
    (resultado: ResultadoRodada) => {
      const esta = ++rodadaAtual.current
      const { nivelAtual, registrar } = fonteAtual.current
      trilhaAtual.current?.aoConcluir()
      setFase({ tipo: 'resultado', resultado })
      setSugestao(null)

      const { salva, anteriores } = registrar(resultado, nivel)
      if (!salva) {
        setSalvamento('sem-conta')
      } else {
        setSalvamento(navigator.onLine ? 'salvando' : 'pendente')
        salva
          .then(() => setSalvamento('salva'))
          .catch((falha: unknown) => {
            console.error(falha)
            setSalvamento('erro')
          })
      }

      // Só sugere quando a rodada foi no nível atual (não numa rodada avulsa em outro nível).
      if (nivel !== nivelAtual) return
      anteriores
        .then((lista) => {
          const nova = avaliarSugestao(definicao.id, nivel, [resultado, ...lista])
          if (nova && esta === rodadaAtual.current) setSugestao({ ...nova, resposta: 'pergunta' })
        })
        .catch((falha: unknown) => console.error(falha))
    },
    [definicao.id, nivel],
  )

  const aceitar = () => {
    if (!sugestao) return
    // Muda na hora (no aparelho); o envio ao servidor segue em segundo plano.
    fonteAtual.current.aceitarNivel(sugestao.nivelNovo)
    setNivel(sugestao.nivelNovo)
    setSugestao({ ...sugestao, resposta: 'aceita' })
  }

  if (definicao.precisaVoz && !perfilEmUso.leituraVoz) {
    return (
      <main
        className={`flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center ${aparencia.classeTela}`}
      >
        <Figura nome="alto-falante" alt="" className="size-24" />
        <h1 className="max-w-2xl text-3xl font-extrabold">{definicao.nome} precisa de áudio</h1>
        <p className="max-w-xl text-xl">
          A leitura em voz alta está desligada{nomeAluno ? ` para ${nomeAluno}` : ''}. Podemos ligar
          só para esta atividade, sem mudar os outros ajustes.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Botao tamanho="grande" onClick={() => setVozSoAqui(true)} autoFocus>
            Ligar a voz só aqui
          </Botao>
          <Botao variante="secundario" tamanho="grande" onClick={voltar}>
            Voltar
          </Botao>
        </div>
      </main>
    )
  }

  if (fase.tipo === 'resultado') {
    return (
      <TelaResultado
        resultado={fase.resultado}
        perfil={perfilEmUso}
        salvamento={salvamento}
        aoJogarDeNovo={() => {
          rodadaAtual.current++
          setSugestao(null)
          setFase({ tipo: 'jogando', rodada: Date.now() })
        }}
        aoEscolherOutra={voltar}
        naTrilha={trilha !== undefined}
        sugestao={
          sugestao && (
            <SugestaoNivel
              sugestao={sugestao}
              resposta={sugestao.resposta}
              nome={nomeAluno}
              nivelAtual={nivel}
              aparencia={aparencia}
              aoAceitar={aceitar}
              aoManter={() => setSugestao({ ...sugestao, resposta: 'mantida' })}
            />
          )
        }
      />
    )
  }

  return (
    <MotorAtividade
      // Nova chave = rodada nova do zero (contagem, cronômetro e estado da atividade).
      key={fase.rodada}
      definicao={definicao}
      nivel={nivel}
      perfil={perfilEmUso}
      aoSair={voltar}
      aoConcluir={aoConcluir}
    />
  )
}
