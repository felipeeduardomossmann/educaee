import { useState } from 'react'
import BotaoLink from '../components/BotaoLink'
import CardAluno from '../components/CardAluno'
import CartaoRecurso from '../components/CartaoRecurso'
import ConfirmarExclusaoAluno from '../components/ConfirmarExclusaoAluno'
import LayoutLogado from '../components/LayoutLogado'
import Mascote from '../components/Mascote'
import ReceberAluno from '../components/ReceberAluno'
import Botao from '../components/Botao'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAlunos } from '../hooks/useAlunos'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { listarTurmas, type Aluno } from '../lib/aluno'

const TODAS = ''
const SEM_TURMA = '\u0000sem-turma'

export default function Painel() {
  useTituloPagina('Meus alunos')
  const usuario = useUsuarioLogado()
  const { alunos, carregando, erro } = useAlunos(usuario.uid)
  const [turmaEscolhida, setTurmaEscolhida] = useState(TODAS)
  const [paraExcluir, setParaExcluir] = useState<Aluno | null>(null)
  const [recebendo, setRecebendo] = useState(false)

  const primeiroNome = usuario.displayName?.split(' ')[0]
  const turmas = listarTurmas(alunos)
  const temSemTurma = alunos.some((aluno) => aluno.turma === '')
  const opcoesTurma = [...turmas.map((turma) => ({ valor: turma, rotulo: turma }))]
  if (temSemTurma) opcoesTurma.push({ valor: SEM_TURMA, rotulo: 'Sem turma' })
  // O filtro só aparece com mais de uma turma (contando "Sem turma").
  const mostrarFiltro = opcoesTurma.length > 1
  // Se a turma escolhida deixou de existir (ex.: último aluno dela excluído), mostra todas.
  const turmaAtiva = opcoesTurma.some((opcao) => opcao.valor === turmaEscolhida)
    ? turmaEscolhida
    : TODAS

  const alunosVisiveis =
    turmaAtiva === TODAS
      ? alunos
      : alunos.filter((aluno) => (aluno.turma || SEM_TURMA) === turmaAtiva)

  return (
    <LayoutLogado>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">
            {primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'}
          </h1>
          <div className="flex flex-wrap gap-3">
            <Botao variante="secundario" onClick={() => setRecebendo(true)}>
              Receber aluno
            </Botao>
            {alunos.length > 0 && (
              <BotaoLink to="/aluno/novo">
                <span aria-hidden="true">+</span> Novo aluno
              </BotaoLink>
            )}
          </div>
        </div>

        {carregando ? (
          <p role="status" className="text-lg text-tinta-suave">
            Carregando alunos…
          </p>
        ) : erro ? (
          <p role="alert" className="rounded-2xl bg-rosa px-5 py-4 text-lg font-semibold">
            Não foi possível carregar os alunos. Verifique a internet e recarregue a página.
          </p>
        ) : alunos.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-white px-6 py-12 text-center shadow-suave">
            <Mascote className="size-32" />
            <p className="text-2xl font-extrabold">Cadastre seu primeiro aluno para começar</p>
            <BotaoLink to="/aluno/novo" tamanho="grande">
              <span aria-hidden="true">+</span> Novo aluno
            </BotaoLink>
          </div>
        ) : (
          <>
            {mostrarFiltro && (
              <div role="group" aria-label="Filtrar por turma" className="flex flex-wrap gap-2">
                {[{ valor: TODAS, rotulo: 'Todas as turmas' }, ...opcoesTurma].map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    aria-pressed={turmaAtiva === opcao.valor}
                    onClick={() => setTurmaEscolhida(opcao.valor)}
                    className={`min-h-11 rounded-full border-2 px-4 font-bold ${
                      turmaAtiva === opcao.valor
                        ? 'border-azul bg-azul text-sobre-cor'
                        : 'border-borda bg-white text-tinta hover:border-azul'
                    }`}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alunosVisiveis.map((aluno) => (
                <li key={aluno.id}>
                  <CardAluno aluno={aluno} aoPedirExclusao={setParaExcluir} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <CartaoRecurso
          figura="giz-de-cera"
          titulo="Desenhos para colorir"
          texto="Escreva um tema e receba desenhos de contorno para imprimir."
          para="/desenhos"
          rotulo="Criar desenhos"
          fundo="bg-lilas"
        />
        <CartaoRecurso
          figura="televisao"
          titulo="Vídeos"
          texto="Busque vídeos do YouTube para crianças e assista aqui mesmo."
          para="/videos"
          rotulo="Buscar vídeos"
          fundo="bg-ceu"
        />
        <CartaoRecurso
          figura="prancha"
          titulo="Prancha de comunicação"
          texto="Cartões com figuras: o aluno toca e o site fala por ele."
          para="/prancha"
          rotulo="Abrir prancha"
          fundo="bg-menta"
        />
      </div>

      {recebendo && <ReceberAluno aoFechar={() => setRecebendo(false)} />}

      <ConfirmarExclusaoAluno aluno={paraExcluir} aoFechar={() => setParaExcluir(null)} />
    </LayoutLogado>
  )
}
