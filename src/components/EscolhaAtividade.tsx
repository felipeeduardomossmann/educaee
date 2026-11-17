import { useEffect, useId, useState, type ReactNode } from 'react'
import { agruparPorHabilidade, carregadorDe } from '../atividades/registro'
import type { DefinicaoAtividade } from '../atividades/tipos'
import { NIVEL_MAXIMO, NIVEL_MINIMO, type AtividadeId, type Niveis } from '../lib/atividade'
import type { Perfil } from '../lib/perfil'
import { prepararSons } from '../lib/sons'
import { temVozPortugues } from '../lib/voz'
import AjustesPerfil from './AjustesPerfil'
import Botao from './Botao'
import Figura from './Figura'
import GrupoOpcoes from './GrupoOpcoes'
import Modal from './Modal'
import PreviaPerfil from './PreviaPerfil'

interface EscolhaAtividadeProps {
  /** Nome do aluno, ou "Convidado". */
  nomeJogador: string
  perfil: Perfil
  niveis: Niveis
  /** Com login, salva no aluno; como convidado, vale só nesta visita. */
  aoSalvarPerfil: (perfil: Perfil) => void
  aoComecar: (atividadeId: AtividadeId, nivel: number) => void
  /** Texto curto abaixo do título dos ajustes (ex.: onde ficam salvos). */
  avisoAjustes: string
  /** Destaque acima das atividades (ex.: "Trilha do dia", só com aluno). */
  destaque?: ReactNode
}

const NIVEIS = Array.from({ length: NIVEL_MAXIMO - NIVEL_MINIMO + 1 }, (_, i) => NIVEL_MINIMO + i)

export default function EscolhaAtividade({
  nomeJogador,
  perfil,
  niveis,
  aoSalvarPerfil,
  aoComecar,
  avisoAjustes,
  destaque,
}: EscolhaAtividadeProps) {
  const [escolhida, setEscolhida] = useState<DefinicaoAtividade | null>(null)
  const [nivel, setNivel] = useState(NIVEL_MINIMO)
  const [editandoAjustes, setEditandoAjustes] = useState(false)
  const [rascunhoPerfil, setRascunhoPerfil] = useState(perfil)
  const [semVoz, setSemVoz] = useState(false)
  const idHabilidade = useId()

  useEffect(() => {
    let ativo = true
    void temVozPortugues().then((tem) => {
      if (ativo) setSemVoz(!tem)
    })
    return () => {
      ativo = false
    }
  }, [])

  const abrirAtividade = (atividade: DefinicaoAtividade) => {
    setNivel(niveis[atividade.id])
    setEscolhida(atividade)
  }

  const abrirAjustes = () => {
    setRascunhoPerfil(perfil)
    setEditandoAjustes(true)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">
          Jogando: <span className="text-azul-escuro">{nomeJogador}</span>
        </h1>
        <Botao variante="secundario" onClick={abrirAjustes}>
          <Figura nome="engrenagem" alt="" className="size-6" />
          Ajustes
        </Botao>
      </div>

      {semVoz && perfil.leituraVoz && (
        <p role="status" className="rounded-2xl bg-sol px-5 py-3 font-semibold">
          Este aparelho não tem voz em português instalada. As instruções vão aparecer só por
          escrito.
        </p>
      )}

      {destaque}

      {/* Uma faixa por habilidade: título em cima e os cartões numa grade logo abaixo. A grade
          usa colunas iguais (mesma largura em todas as faixas) e cartões da mesma altura. */}
      <div className="flex flex-col gap-8">
        {agruparPorHabilidade().map(({ habilidade, atividades }, indice) => (
          <section key={habilidade} aria-labelledby={`${idHabilidade}-${indice}`}>
            <h2
              id={`${idHabilidade}-${indice}`}
              className="mb-3 text-lg font-extrabold text-tinta-suave"
            >
              {habilidade}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {atividades.map((atividade) => {
                const disponivel = carregadorDe(atividade) !== undefined
                return (
                  <li key={atividade.id}>
                    <button
                      type="button"
                      disabled={!disponivel}
                      onClick={() => abrirAtividade(atividade)}
                      className="flex h-full min-h-28 w-full items-center gap-4 rounded-3xl border-2 border-borda bg-white p-4 text-left shadow-suave hover:border-azul disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-borda sm:min-h-32 sm:p-5"
                    >
                      <Figura
                        nome={atividade.icone}
                        alt=""
                        className="size-14 shrink-0 sm:size-16"
                      />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-xl leading-tight font-extrabold text-pretty">
                          {atividade.nome}
                        </span>
                        <span className="font-semibold text-tinta-suave">
                          {disponivel ? `Nível ${niveis[atividade.id]}` : 'Em breve'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <Modal
        aberto={escolhida !== null}
        titulo={escolhida?.nome ?? ''}
        aoFechar={() => setEscolhida(null)}
        acoes={
          <>
            <Botao variante="secundario" tamanho="grande" onClick={() => setEscolhida(null)}>
              Voltar
            </Botao>
            <Botao
              tamanho="grande"
              onClick={() => {
                if (!escolhida) return
                // O toque em "Começar" libera o áudio do navegador para sons e voz.
                prepararSons()
                aoComecar(escolhida.id, nivel)
              }}
            >
              Começar
            </Botao>
          </>
        }
      >
        {escolhida && (
          <div className="flex flex-col gap-4">
            <p className="text-tinta-suave">{escolhida.descricao}</p>
            <GrupoOpcoes
              legenda="Nível"
              opcoes={NIVEIS.map((valor) => ({
                valor: String(valor),
                rotulo: valor === niveis[escolhida.id] ? `${valor} (atual)` : String(valor),
              }))}
              valor={String(nivel)}
              aoMudar={(valor) => setNivel(Number(valor))}
            />
          </div>
        )}
      </Modal>

      <Modal
        aberto={editandoAjustes}
        titulo="Ajustes"
        largo
        aoFechar={() => setEditandoAjustes(false)}
        acoes={
          <>
            <Botao variante="secundario" onClick={() => setEditandoAjustes(false)}>
              Cancelar
            </Botao>
            <Botao
              onClick={() => {
                aoSalvarPerfil(rascunhoPerfil)
                setEditandoAjustes(false)
              }}
            >
              Salvar ajustes
            </Botao>
          </>
        }
      >
        <p className="mb-5 text-tinta-suave">{avisoAjustes}</p>
        <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,18rem)]">
          <AjustesPerfil perfil={rascunhoPerfil} aoMudar={setRascunhoPerfil} />
          <div className="md:sticky md:top-0 md:self-start">
            <PreviaPerfil perfil={rascunhoPerfil} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
