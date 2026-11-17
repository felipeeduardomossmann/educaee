import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAparencia } from '../atividades/aparencia'
import { calcularGrade } from '../atividades/grade'
import { useEspacoDisponivel } from '../atividades/useEspacoDisponivel'
import Botao from '../components/Botao'
import Figura from '../components/Figura'
import type { Perfil } from '../lib/perfil'
import { falarAudio, pararFala } from '../lib/voz'
import { paginar, textoDaFrase, type CartaoPrancha } from './prancha'
import { CATEGORIAS, falaDoCartao, type CategoriaId } from './vocabulario'

const ESPACO = 14
const MAXIMO_NA_FRASE = 12
const DESTAQUE_MS = 700

interface PranchaProps {
  cartoes: readonly CartaoPrancha[]
  porTela: number
  perfil: Perfil
  /** Botões do topo (Voltar, Personalizar, PDF...). */
  topo: ReactNode
  titulo: string
}

/** Pictograma do cartão (figura do catálogo ou imagem própria). */
export function Pictograma({ cartao, className }: { cartao: CartaoPrancha; className: string }) {
  if (cartao.figura) return <Figura nome={cartao.figura} alt="" className={className} />
  return (
    <img src={cartao.imagem} alt="" className={`object-contain ${className}`} draggable={false} />
  )
}

/** Prancha de comunicação: tocar no cartão fala a palavra e junta na frase. */
export default function Prancha({ cartoes, porTela, perfil, topo, titulo }: PranchaProps) {
  const aparencia = useAparencia(perfil)
  const categorias = CATEGORIAS.filter((c) => cartoes.some((cartao) => cartao.categoria === c.id))
  const [categoria, setCategoria] = useState<CategoriaId>(categorias[0]?.id ?? 'quero')
  const [pagina, setPagina] = useState(0)
  const [frase, setFrase] = useState<CartaoPrancha[]>([])
  const [destacado, setDestacado] = useState<string | null>(null)
  const [falandoFrase, setFalandoFrase] = useState(false)
  const falaAtual = useRef(0)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      pararFala()
      window.clearTimeout(temporizador.current)
    },
    [],
  )

  const categoriaAtiva = categorias.some((c) => c.id === categoria)
    ? categoria
    : (categorias[0]?.id ?? 'quero')
  const daCategoria = cartoes.filter((c) => c.categoria === categoriaAtiva)
  const paginas = paginar(daCategoria, porTela)
  const paginaAtiva = Math.min(pagina, paginas.length - 1)
  const visiveis = paginas[paginaAtiva] ?? []
  const estilo = CATEGORIAS.find((c) => c.id === categoriaAtiva)

  const { ref, largura, altura } = useEspacoDisponivel<HTMLDivElement>(24)
  // Desconta a linha de paginação (quando há mais de uma tela).
  const grade = calcularGrade({
    quantidade: porTela,
    largura,
    // Em telas estreitas (celular), os cartões seguem a largura e a página rola.
    altura: largura < 640 ? largura * 1.1 : altura - (paginas.length > 1 ? 64 : 0),
    espaco: ESPACO,
    minimo: aparencia.areaToque,
    maximo: 280,
  })

  const falarCartao = (cartao: CartaoPrancha) =>
    falarAudio(cartao.audio, falaDoCartao(cartao.palavra), perfil.velocidadeVoz)

  const tocar = (cartao: CartaoPrancha) => {
    falaAtual.current++
    setFalandoFrase(false)
    void falarCartao(cartao)
    setFrase((atual) => [...atual, cartao].slice(-MAXIMO_NA_FRASE))
    setDestacado(cartao.id)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setDestacado(null), DESTAQUE_MS)
  }

  const falarFrase = async () => {
    const minha = ++falaAtual.current
    setFalandoFrase(true)
    for (const cartao of frase) {
      if (minha !== falaAtual.current) return
      await falarCartao(cartao)
    }
    if (minha === falaAtual.current) setFalandoFrase(false)
  }

  const limpar = () => {
    falaAtual.current++
    pararFala()
    setFalandoFrase(false)
    setFrase([])
  }

  const alto = aparencia.altoContraste

  return (
    <main className={`flex min-h-dvh flex-col gap-3 p-3 sm:p-4 ${aparencia.classeTela}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{topo}</div>
        <h1 className="text-xl font-extrabold sm:text-2xl">{titulo}</h1>
      </div>

      {/* Barra de frase */}
      <section
        aria-label="Frase"
        className={`flex flex-wrap items-center gap-2 rounded-3xl p-2 ${
          alto ? 'border-4 border-ac-contorno' : 'border-2 border-borda bg-white shadow-suave'
        }`}
      >
        <p aria-live="polite" className="sr-only">
          {textoDaFrase(frase)}
        </p>
        <ol
          className="flex min-h-16 min-w-40 flex-1 flex-wrap items-center gap-2"
          aria-hidden="true"
        >
          {frase.length === 0 ? (
            <li className="px-3 text-lg opacity-70">Toque nos cartões para montar uma frase.</li>
          ) : (
            frase.map((cartao, i) => (
              <li
                key={i}
                className={`flex items-center gap-1 rounded-2xl px-2 py-1 ${
                  alto ? 'border-2 border-ac-texto' : 'bg-creme'
                }`}
              >
                <Pictograma cartao={cartao} className="size-10" />
                <span className="text-lg font-bold">{cartao.palavra}</span>
              </li>
            ))
          )}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Botao tamanho="grande" onClick={() => void falarFrase()} disabled={frase.length === 0}>
            <Figura nome="alto-falante" alt="" className="size-7" />
            {falandoFrase ? 'Falando…' : 'Falar frase'}
          </Botao>
          <Botao
            variante="secundario"
            onClick={() => setFrase((atual) => atual.slice(0, -1))}
            disabled={frase.length === 0}
          >
            Apagar último
          </Botao>
          <Botao variante="secundario" onClick={limpar} disabled={frase.length === 0}>
            Limpar
          </Botao>
        </div>
      </section>

      {/* Abas das categorias */}
      <div role="tablist" aria-label="Categorias" className="flex flex-wrap gap-2">
        {categorias.map((c) => {
          const ativa = c.id === categoriaAtiva
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => {
                setCategoria(c.id)
                setPagina(0)
              }}
              className={`min-h-14 rounded-2xl px-5 text-lg font-extrabold ${
                alto
                  ? `border-4 ${ativa ? 'border-ac-contorno bg-ac-contorno text-ac-fundo' : 'border-ac-texto'}`
                  : `${c.fundo} border-4 text-tinta ${ativa ? c.borda : 'border-transparent opacity-80'}`
              }`}
            >
              {c.nome}
            </button>
          )
        })}
      </div>

      {/* Cartões da categoria */}
      <div
        ref={ref}
        role="tabpanel"
        aria-label={estilo?.nome}
        className="flex flex-1 flex-col items-center justify-start gap-3"
      >
        {largura > 0 && (
          <div
            className="flex flex-wrap justify-center"
            style={{
              width: grade.colunas * grade.lado + (grade.colunas - 1) * ESPACO,
              gap: ESPACO,
            }}
          >
            {visiveis.map((cartao) => {
              const destaque = destacado === cartao.id
              return (
                <button
                  key={cartao.id}
                  type="button"
                  aria-label={cartao.palavra}
                  onClick={() => tocar(cartao)}
                  style={{ width: grade.lado, height: grade.lado }}
                  className={`flex touch-manipulation flex-col items-center justify-center gap-1 rounded-3xl p-2 select-none ${
                    alto
                      ? `border-4 bg-ac-fundo ${destaque ? 'border-ac-texto' : 'border-ac-contorno'}`
                      : `${estilo?.fundo ?? 'bg-white'} border-4 shadow-suave ${
                          destaque ? 'border-azul-escuro' : 'border-white'
                        }`
                  } ${cartao.inicio ? 'outline-2 outline-offset-[-10px] outline-tinta/30 outline-dashed' : ''}`}
                >
                  <Pictograma cartao={cartao} className="min-h-0 w-[64%] flex-1" />
                  <span className="text-center text-xl leading-tight font-extrabold">
                    {cartao.palavra}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {paginas.length > 1 && (
          <div className="flex items-center gap-3">
            <Botao
              variante="secundario"
              onClick={() => setPagina(Math.max(0, paginaAtiva - 1))}
              disabled={paginaAtiva === 0}
            >
              ◀ Anterior
            </Botao>
            <span className="font-bold">
              Tela {paginaAtiva + 1} de {paginas.length}
            </span>
            <Botao
              variante="secundario"
              onClick={() => setPagina(Math.min(paginas.length - 1, paginaAtiva + 1))}
              disabled={paginaAtiva === paginas.length - 1}
            >
              Próximos ▶
            </Botao>
          </div>
        )}
      </div>
    </main>
  )
}
