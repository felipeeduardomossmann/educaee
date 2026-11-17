import { useState } from 'react'
import AjustesPerfil from '../components/AjustesPerfil'
import Botao from '../components/Botao'
import BotaoGoogle from '../components/BotaoGoogle'
import Card from '../components/Card'
import CardAluno from '../components/CardAluno'
import FaixaConvidado from '../components/FaixaConvidado'
import Figura from '../components/Figura'
import Logo from '../components/Logo'
import Mascote from '../components/Mascote'
import Modal from '../components/Modal'
import PreviaPerfil from '../components/PreviaPerfil'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { NIVEIS_INICIAIS } from '../lib/atividade'
import { NOMES_FIGURAS } from '../lib/nomes-figuras'
import { PERFIL_PADRAO, type Perfil } from '../lib/perfil'

const cores = ['creme', 'tinta', 'tinta-suave', 'azul', 'azul-escuro', 'coral', 'verde', 'vermelho']
const pasteis = ['ceu', 'menta', 'pessego', 'lilas', 'sol', 'rosa'] as const

/** Vitrine dos componentes base. Só existe no modo de desenvolvimento (npm run dev). */
export default function Componentes() {
  useTituloPagina('Componentes')
  const [modalAberto, setModalAberto] = useState(false)
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO)

  return (
    <>
      <FaixaConvidado aoEntrar={() => setModalAberto(true)} />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 p-6">
        <h1 className="text-3xl font-extrabold">Componentes base</h1>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Card de aluno</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'a', nome: 'Ana', turma: '3º ano B', perfil },
              { id: 'b', nome: 'Bernardo Henrique', turma: '', perfil: PERFIL_PADRAO },
            ].map((aluno) => (
              <li key={aluno.id}>
                <CardAluno
                  aluno={{ ...aluno, niveis: NIVEIS_INICIAIS }}
                  aoPedirExclusao={() => setModalAberto(true)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Ajustes do perfil e prévia</h2>
          <Card className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <AjustesPerfil perfil={perfil} aoMudar={setPerfil} />
            <div className="lg:sticky lg:top-6 lg:self-start">
              <PreviaPerfil perfil={perfil} />
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Logo e mascote</h2>
          <div className="flex flex-wrap items-center gap-8">
            <Logo className="text-5xl" />
            <Logo />
            <Mascote />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Cores</h2>
          <div className="flex flex-wrap gap-3">
            {[...cores, ...pasteis].map((cor) => (
              <div key={cor} className="flex flex-col items-center gap-1 text-sm">
                <div
                  className="size-16 rounded-2xl border border-borda"
                  style={{ background: `var(--color-${cor})` }}
                />
                {cor}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Botões</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Botao>Primário</Botao>
            <Botao variante="secundario">Secundário</Botao>
            <Botao variante="suave">Suave</Botao>
            <Botao disabled>Desativado</Botao>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Botao tamanho="grande" onClick={() => setModalAberto(true)}>
              Abrir modal
            </Botao>
            <BotaoGoogle tamanho="grande" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>Branco</Card>
            {pasteis.map((cor) => (
              <Card key={cor} cor={cor}>
                {cor}
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Figuras ({NOMES_FIGURAS.length})</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3">
            {NOMES_FIGURAS.map((nome) => (
              <li key={nome} className="flex flex-col items-center gap-1 text-center text-sm">
                <Figura nome={nome} alt="" className="size-14" />
                {nome}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Modal
        aberto={modalAberto}
        titulo="Excluir aluno?"
        aoFechar={() => setModalAberto(false)}
        acoes={
          <>
            <Botao variante="secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao onClick={() => setModalAberto(false)}>Confirmar</Botao>
          </>
        }
      >
        Isso apaga o aluno e todo o histórico. Não pode ser desfeito.
      </Modal>
    </>
  )
}
