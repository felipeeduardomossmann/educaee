import { useId, useState } from 'react'
import { useParams } from 'react-router'
import Botao from '../components/Botao'
import BotaoLink from '../components/BotaoLink'
import Card from '../components/Card'
import GrupoOpcoes from '../components/GrupoOpcoes'
import LayoutLogado from '../components/LayoutLogado'
import Modal from '../components/Modal'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAluno } from '../hooks/useAluno'
import { useCartoesProprios } from '../hooks/useCartoesProprios'
import { useOnline } from '../hooks/useOnline'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { Aluno } from '../lib/aluno'
import { salvarPrancha } from '../lib/alunos'
import type { CodigoErroApi } from '../lib/api'
import { criarCartao, excluirCartao } from '../lib/cartoes'
import { gerarPictogramas, MENSAGENS_ERRO_PICTOGRAMA, redimensionar } from '../lib/pictogramas'
import { Pictograma } from '../prancha/PranchaComunicacao'
import {
  alternarCartao,
  configPadrao,
  idProprio,
  moverCartao,
  todosOsCartoes,
  type CartaoPrancha,
  type CartaoProprio,
  type ConfigPrancha,
} from '../prancha/prancha'
import {
  CARTOES_POR_TELA,
  CATEGORIAS,
  TAMANHO_MAXIMO_PALAVRA,
  type CartoesPorTela,
  type CategoriaId,
} from '../prancha/vocabulario'

/** /aluno/:id/prancha/editar — escolher os cartões, a ordem, quantos por tela e criar cartões. */
export default function PranchaEditar() {
  const { id = null } = useParams()
  const usuario = useUsuarioLogado()
  const estado = useAluno(usuario.uid, id)
  const proprios = useCartoesProprios(usuario.uid)
  useTituloPagina('Personalizar prancha')

  if (estado.situacao === 'carregando' || proprios === null) {
    return (
      <LayoutLogado>
        <p role="status" className="text-lg text-tinta-suave">
          Carregando…
        </p>
      </LayoutLogado>
    )
  }
  if (estado.situacao !== 'pronto') {
    return (
      <LayoutLogado>
        <p role="alert" className="text-xl font-bold">
          Aluno não encontrado.
        </p>
      </LayoutLogado>
    )
  }
  return <Editor uid={usuario.uid} aluno={estado.aluno} proprios={proprios} />
}

function Editor({
  uid,
  aluno,
  proprios,
}: {
  uid: string
  aluno: Aluno
  proprios: CartaoProprio[]
}) {
  const [config, setConfig] = useState<ConfigPrancha>(aluno.prancha ?? configPadrao())
  const [situacao, setSituacao] = useState<'salvo' | 'alterado' | 'salvando' | 'pendente' | 'erro'>(
    'salvo',
  )
  const [paraExcluir, setParaExcluir] = useState<CartaoPrancha | null>(null)
  const todos = todosOsCartoes(proprios)

  const mudar = (nova: ConfigPrancha) => {
    setConfig(nova)
    setSituacao('alterado')
  }
  const salvar = (valor = config) => {
    setConfig(valor)
    // Grava na cópia local na hora; o "salvo" só aparece quando o servidor confirma.
    setSituacao(navigator.onLine ? 'salvando' : 'pendente')
    salvarPrancha(uid, aluno.id, valor)
      .then(() => setSituacao((atual) => (atual === 'alterado' ? atual : 'salvo')))
      .catch((falha: unknown) => {
        console.error(falha)
        setSituacao('erro')
      })
  }

  const excluir = async () => {
    if (!paraExcluir) return
    const idCartao = paraExcluir.id.replace(/^c:/, '')
    setParaExcluir(null)
    await excluirCartao(uid, idCartao).catch((falha: unknown) => console.error(falha))
    salvar({ ...config, cartoes: config.cartoes.filter((c) => c !== paraExcluir.id) })
  }

  return (
    <LayoutLogado>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">Prancha de {aluno.nome}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="font-semibold text-tinta-suave">
              {
                {
                  salvo: 'Tudo salvo.',
                  salvando: 'Salvando…',
                  pendente: 'Salvo neste aparelho; será enviado quando a internet voltar.',
                  erro: 'Não foi possível salvar. Tente de novo.',
                  alterado: 'Há mudanças não salvas.',
                }[situacao]
              }
            </p>
            <Botao
              onClick={() => salvar()}
              disabled={situacao === 'salvo' || situacao === 'salvando'}
            >
              Salvar
            </Botao>
            <BotaoLink to={`/aluno/${aluno.id}/prancha`} variante="secundario">
              Ver prancha
            </BotaoLink>
          </div>
        </div>

        <Card>
          <GrupoOpcoes<string>
            legenda="Cartões por tela"
            ajuda="Menos cartões por tela = cartões maiores."
            opcoes={CARTOES_POR_TELA.map((n) => ({ valor: String(n), rotulo: String(n) }))}
            valor={String(config.porTela)}
            aoMudar={(valor) => mudar({ ...config, porTela: Number(valor) as CartoesPorTela })}
          />
        </Card>

        <CriarCartao
          uid={uid}
          aoCriar={(novo) => {
            const lista = todosOsCartoes([...proprios, novo])
            salvar(alternarCartao(config, idProprio(novo.id), lista))
          }}
        />

        {CATEGORIAS.map((categoria) => {
          const daCategoria = todos.filter((c) => c.categoria === categoria.id)
          const ligados = config.cartoes
            .map((idCartao) => daCategoria.find((c) => c.id === idCartao))
            .filter((c): c is CartaoPrancha => c !== undefined)
          const desligados = daCategoria.filter((c) => !config.cartoes.includes(c.id))
          return (
            <section
              key={categoria.id}
              aria-labelledby={`cat-${categoria.id}`}
              className="flex flex-col gap-3"
            >
              <h2 id={`cat-${categoria.id}`} className="text-2xl font-extrabold">
                {categoria.nome}
              </h2>
              <ul className="flex flex-col gap-2">
                {[...ligados, ...desligados].map((cartao) => {
                  const ligado = config.cartoes.includes(cartao.id)
                  const posicao = ligados.indexOf(cartao)
                  return (
                    <li
                      key={cartao.id}
                      className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-2 ${
                        ligado
                          ? `${categoria.fundo} border-transparent`
                          : 'border-borda bg-white opacity-75'
                      }`}
                    >
                      <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={ligado}
                          onChange={() => mudar(alternarCartao(config, cartao.id, todos))}
                          className="size-6 accent-azul"
                        />
                        <span className="flex size-12 items-center justify-center rounded-xl bg-white">
                          <Pictograma cartao={cartao} className="size-10" />
                        </span>
                        <span className="text-lg font-bold">{cartao.palavra}</span>
                        {cartao.id.startsWith('c:') && (
                          <span className="rounded-full bg-lilas px-2 text-sm font-semibold">
                            próprio
                          </span>
                        )}
                      </label>
                      {ligado && (
                        <span className="flex gap-1">
                          <Botao
                            variante="secundario"
                            aria-label={`Mover ${cartao.palavra} para antes`}
                            disabled={posicao <= 0}
                            onClick={() => mudar(moverCartao(config, cartao.id, -1, todos))}
                          >
                            ↑
                          </Botao>
                          <Botao
                            variante="secundario"
                            aria-label={`Mover ${cartao.palavra} para depois`}
                            disabled={posicao >= ligados.length - 1}
                            onClick={() => mudar(moverCartao(config, cartao.id, 1, todos))}
                          >
                            ↓
                          </Botao>
                        </span>
                      )}
                      {cartao.id.startsWith('c:') && (
                        <Botao variante="suave" onClick={() => setParaExcluir(cartao)}>
                          Excluir
                        </Botao>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <Modal
        aberto={paraExcluir !== null}
        titulo="Excluir cartão?"
        aoFechar={() => setParaExcluir(null)}
        acoes={
          <>
            <Botao variante="secundario" onClick={() => setParaExcluir(null)}>
              Cancelar
            </Botao>
            <Botao onClick={() => void excluir()}>Excluir</Botao>
          </>
        }
      >
        O cartão “{paraExcluir?.palavra}” sai da prancha de todos os seus alunos.
      </Modal>
    </LayoutLogado>
  )
}

function CriarCartao({ uid, aoCriar }: { uid: string; aoCriar: (cartao: CartaoProprio) => void }) {
  const usuario = useUsuarioLogado()
  const online = useOnline()
  const idPalavra = useId()
  const idCategoria = useId()
  const [palavra, setPalavra] = useState('')
  const [categoria, setCategoria] = useState<CategoriaId>('quero')
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<CodigoErroApi | null>(null)
  const [opcoes, setOpcoes] = useState<{ imagens: string[]; audio: string | null } | null>(null)
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [restam, setRestam] = useState<number | null>(null)
  const limpa = palavra.trim()

  const gerar = async () => {
    if (!limpa || gerando) return
    setGerando(true)
    setErro(null)
    setOpcoes(null)
    setEscolhida(null)
    const resultado = await gerarPictogramas(usuario, limpa)
    if (resultado.restantes) setRestam(resultado.restantes.restamHoje)
    if (resultado.ok) setOpcoes({ imagens: resultado.imagens, audio: resultado.audio })
    else setErro(resultado.codigo)
    setGerando(false)
  }

  const salvar = async () => {
    if (!opcoes || escolhida === null) return
    setSalvando(true)
    try {
      const imagem = await redimensionar(opcoes.imagens[escolhida] ?? '', 256, 'image/webp', 0.8)
      const dados = { palavra: limpa, categoria, imagem, audio: opcoes.audio }
      const novoId = await criarCartao(uid, dados)
      aoCriar({ id: novoId, ...dados })
      setPalavra('')
      setOpcoes(null)
      setEscolhida(null)
    } catch (falha) {
      console.error(falha)
      setErro('falha')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold">Criar cartão próprio</h2>
      <p className="text-tinta-suave">
        Escreva a palavra e a inteligência artificial cria duas opções de pictograma. O cartão fica
        disponível para todos os seus alunos. Conta no mesmo limite diário dos desenhos.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label htmlFor={idPalavra} className="flex flex-1 flex-col gap-1 font-bold">
          Palavra
          <input
            id={idPalavra}
            value={palavra}
            onChange={(e) => setPalavra(e.target.value)}
            maxLength={TAMANHO_MAXIMO_PALAVRA}
            placeholder="Ex.: suco"
            className="min-h-12 rounded-2xl border-2 border-borda bg-white px-4 text-lg font-normal"
          />
        </label>
        <label htmlFor={idCategoria} className="flex flex-col gap-1 font-bold">
          Categoria
          <select
            id={idCategoria}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaId)}
            className="min-h-12 rounded-2xl border-2 border-borda bg-white px-3 text-lg font-normal"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <Botao onClick={() => void gerar()} disabled={!limpa || gerando || !online}>
          {gerando ? 'Criando…' : 'Gerar pictogramas'}
        </Botao>
      </div>
      <p className="text-sm text-tinta-suave">
        {!online
          ? 'Sem internet: para criar cartões, é preciso estar conectado.'
          : restam !== null
            ? `Restam ${restam} imagens hoje.`
            : 'Leva uns 20 segundos.'}
      </p>
      {erro && (
        <p role="alert" className="rounded-2xl bg-rosa px-4 py-3 font-semibold">
          {MENSAGENS_ERRO_PICTOGRAMA[erro]}
        </p>
      )}
      {opcoes && (
        <div className="flex flex-col gap-3">
          <p className="font-bold">Escolha um pictograma:</p>
          <div role="radiogroup" aria-label="Opções de pictograma" className="flex flex-wrap gap-4">
            {opcoes.imagens.map((imagem, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={escolhida === i}
                aria-label={`Opção ${i + 1}`}
                onClick={() => setEscolhida(i)}
                className={`size-40 overflow-hidden rounded-2xl border-4 bg-white ${
                  escolhida === i ? 'border-azul' : 'border-borda'
                }`}
              >
                <img src={imagem} alt="" className="size-full object-contain" />
              </button>
            ))}
          </div>
          <Botao
            onClick={() => void salvar()}
            disabled={escolhida === null || salvando}
            className="self-start"
          >
            {salvando ? 'Salvando…' : 'Salvar cartão'}
          </Botao>
        </div>
      )}
    </Card>
  )
}
