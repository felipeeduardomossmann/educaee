import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAparencia } from '../atividades/aparencia'
import { irParaAtividade } from '../atividades/navegacao'
import { ATIVIDADES, buscarAtividade, carregadorDe } from '../atividades/registro'
import Botao from '../components/Botao'
import BotaoLink from '../components/BotaoLink'
import Carregando from '../components/Carregando'
import Figura from '../components/Figura'
import Mascote from '../components/Mascote'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAluno } from '../hooks/useAluno'
import { useSessoes } from '../hooks/useSessoes'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { Aluno } from '../lib/aluno'
import {
  etapasFeitas,
  FALA_TRILHA_COMPLETA,
  FALA_TRILHA_INICIO,
  montarTrilha,
  ROTULO_PAPEL,
} from '../lib/trilha'
import { falar, pararFala } from '../lib/voz'

/** /aluno/:id/trilha — a trilha do dia: 4 etapas, com o mascote avançando no caminho. */
export default function TrilhaDoDia() {
  const { id = null } = useParams()
  const usuario = useUsuarioLogado()
  const estado = useAluno(usuario.uid, id)
  useTituloPagina('Trilha do dia')

  if (estado.situacao === 'carregando') return <Carregando />
  if (estado.situacao !== 'pronto') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p role="alert" className="text-xl font-bold">
          Não foi possível abrir a trilha.
        </p>
        <BotaoLink to="/painel">Voltar para meus alunos</BotaoLink>
      </main>
    )
  }
  return <Trilha uid={usuario.uid} aluno={estado.aluno} />
}

function Trilha({ uid, aluno }: { uid: string; aluno: Aluno }) {
  const navigate = useNavigate()
  const aparencia = useAparencia(aluno.perfil)
  const { sessoes, carregando } = useSessoes(uid, aluno.id)
  const disponiveis = useMemo(
    () => ATIVIDADES.filter((a) => carregadorDe(a) !== undefined).map((a) => a.id),
    [],
  )
  // Só as rodadas de antes de hoje contam: a trilha fica igual enquanto o aluno joga.
  const etapas = useMemo(
    () => (carregando ? [] : montarTrilha(disponiveis, sessoes, new Date())),
    [carregando, disponiveis, sessoes],
  )
  const feitas = Math.min(etapasFeitas(aluno.id), etapas.length)
  const completa = etapas.length > 0 && feitas >= etapas.length
  const atual = etapas[feitas]

  useEffect(() => {
    if (carregando || !aluno.perfil.leituraVoz) return
    if (completa) void falar(FALA_TRILHA_COMPLETA, aluno.perfil.velocidadeVoz)
    else if (feitas === 0) void falar(FALA_TRILHA_INICIO, aluno.perfil.velocidadeVoz)
    return pararFala
  }, [carregando, completa, feitas, aluno.perfil.leituraVoz, aluno.perfil.velocidadeVoz])

  if (carregando) return <Carregando />

  const seguir = () => {
    if (!atual) return
    irParaAtividade(navigate, atual.atividadeId, {
      jogador: { tipo: 'aluno', alunoId: aluno.id },
      nivel: aluno.niveis[atual.atividadeId],
      trilha: { etapa: feitas },
    })
  }

  return (
    <main
      className={`flex min-h-dvh flex-col items-center gap-8 px-4 py-8 text-center ${aparencia.classeTela}`}
    >
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        <BotaoLink to={`/aluno/${aluno.id}/atividades`} variante="secundario">
          <Figura nome="porta" alt="" className="size-6" />
          Sair da trilha
        </BotaoLink>
        <p className="text-lg font-bold">{aluno.nome}</p>
      </div>

      <h1 className="text-4xl font-extrabold">{completa ? 'Trilha completa!' : 'Trilha do dia'}</h1>

      {/* O caminho: cada etapa é uma parada; o mascote fica na etapa atual. */}
      <ol
        aria-label={`Caminho da trilha: ${feitas} de ${etapas.length} etapas feitas`}
        className="flex w-full max-w-5xl flex-col items-center gap-2 lg:flex-row lg:items-end lg:justify-center lg:gap-0"
      >
        {etapas.map((etapa, i) => {
          const definicao = buscarAtividade(etapa.atividadeId)
          const feita = i < feitas
          const ehAtual = i === feitas
          return (
            <li
              key={etapa.atividadeId}
              className="flex flex-col items-center lg:flex-row lg:items-end"
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`block h-8 w-1.5 rounded-full lg:mb-14 lg:h-1.5 lg:w-14 ${feita || ehAtual ? 'bg-verde' : 'bg-borda'}`}
                />
              )}
              <div className="flex w-44 flex-col items-center gap-2">
                <div className={ehAtual ? 'flex h-24 items-end' : 'hidden h-24 lg:flex'}>
                  {ehAtual && <Mascote className="size-24" />}
                </div>
                <div
                  className={`relative flex size-24 items-center justify-center rounded-full border-4 bg-white ${
                    ehAtual ? 'border-azul' : feita ? 'border-verde' : 'border-borda'
                  }`}
                >
                  <Figura nome={definicao?.icone ?? 'estrela'} alt="" className="size-14" />
                  {feita && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-verde text-xl font-extrabold text-sobre-cor"
                    >
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold uppercase opacity-80">
                  {ROTULO_PAPEL[etapa.papel]}
                </p>
                <p className="text-lg leading-tight font-extrabold">
                  {definicao?.nome}
                  <span className="sr-only">
                    {feita ? ' (feita)' : ehAtual ? ' (agora)' : ' (depois)'}
                  </span>
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {completa ? (
        <div className="flex flex-col items-center gap-5">
          <Mascote className="size-32" />
          <p role="status" className="max-w-xl text-2xl font-bold">
            Você foi até o fim do caminho de hoje. Muito bem!
          </p>
          <BotaoLink to={`/aluno/${aluno.id}/atividades`} tamanho="grande">
            Voltar às atividades
          </BotaoLink>
        </div>
      ) : (
        atual && (
          <Botao tamanho="grande" onClick={seguir} autoFocus>
            <Figura nome="continuar" alt="" className="size-8" />
            {feitas === 0 ? 'Começar' : 'Continuar'}: {buscarAtividade(atual.atividadeId)?.nome}
          </Botao>
        )
      )}
    </main>
  )
}
