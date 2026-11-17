import { useEffect, useId, useState, type FormEvent } from 'react'
import Botao from '../components/Botao'
import Card from '../components/Card'
import Figura from '../components/Figura'
import LayoutLogado from '../components/LayoutLogado'
import AssistirVideo from '../components/videos/AssistirVideo'
import AvisoYoutube from '../components/videos/AvisoYoutube'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useOnline } from '../hooks/useOnline'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { CodigoErroApi, Restantes } from '../lib/api'
import {
  buscarVideos,
  consultarRestantesVideos,
  duracaoPorExtenso,
  formatarDuracaoVideo,
  MENSAGENS_ERRO_VIDEOS,
  semEscondidos,
  TAMANHO_MAXIMO_TERMO,
  type Video,
} from '../lib/videos'
import { esconderVideo, observarEscondidos } from '../lib/videos-escondidos'

interface Busca {
  termo: string
  videos: Video[]
}

// A última busca fica só na memória desta visita (não guardamos histórico de buscas).
let buscaGuardada: Busca | null = null

export default function Videos() {
  useTituloPagina('Vídeos')
  const usuario = useUsuarioLogado()
  const online = useOnline()
  const idCampo = useId()
  const idAjuda = useId()
  const [termo, setTermo] = useState(buscaGuardada?.termo ?? '')
  const [busca, setBusca] = useState<Busca | null>(buscaGuardada)
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<CodigoErroApi | null>(null)
  const [restantes, setRestantes] = useState<Restantes | null>(null)
  const [escondidos, setEscondidos] = useState<Set<string>>(new Set())
  const [assistindo, setAssistindo] = useState<Video | null>(null)

  useEffect(() => {
    buscaGuardada = busca
  }, [busca])

  useEffect(() => observarEscondidos(usuario.uid, setEscondidos), [usuario.uid])

  useEffect(() => {
    if (!online) return
    let ativo = true
    void consultarRestantesVideos(usuario).then((valor) => {
      if (ativo && valor) setRestantes(valor)
    })
    return () => {
      ativo = false
    }
  }, [usuario, online])

  // Ao trocar entre a lista e o vídeo, volta para o topo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [assistindo])

  const termoLimpo = termo.trim()
  const semSaldo = restantes?.restamHoje === 0
  const visiveis = busca ? semEscondidos(busca.videos, escondidos) : []

  const buscar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!termoLimpo || buscando || semSaldo || !online) return
    setBuscando(true)
    setErro(null)
    const resultado = await buscarVideos(usuario, termoLimpo)
    if (resultado.restantes) setRestantes(resultado.restantes)
    if (resultado.ok) setBusca({ termo: termoLimpo, videos: resultado.videos })
    else setErro(resultado.codigo)
    setBuscando(false)
  }

  if (assistindo) {
    return (
      <LayoutLogado>
        <AssistirVideo
          key={assistindo.id}
          video={assistindo}
          aoVoltar={() => setAssistindo(null)}
          aoEsconder={() => esconderVideo(usuario.uid, assistindo.id)}
        />
      </LayoutLogado>
    )
  }

  return (
    <LayoutLogado>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Figura nome="televisao" alt="" className="size-14 shrink-0" />
          <div>
            <h1 className="text-3xl font-extrabold">Vídeos</h1>
            <p className="text-lg text-tinta-suave">
              Busque vídeos do YouTube feitos para crianças e assista aqui, sem sugestões de outros
              vídeos no fim.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={(e) => void buscar(e)} className="flex flex-col gap-3">
            <label htmlFor={idCampo} className="text-lg font-bold">
              O que você quer procurar?
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id={idCampo}
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                maxLength={TAMANHO_MAXIMO_TERMO}
                placeholder="Ex.: dinossauros"
                aria-describedby={idAjuda}
                autoComplete="off"
                className="min-h-12 flex-1 rounded-2xl border-2 border-borda bg-white px-4 text-lg focus:border-azul"
              />
              <Botao
                type="submit"
                disabled={!termoLimpo || buscando || semSaldo || !online}
                className="sm:w-40"
              >
                {buscando ? 'Buscando…' : 'Buscar'}
              </Botao>
            </div>
            <div
              id={idAjuda}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-tinta-suave"
            >
              <span>
                {!online
                  ? 'Sem internet: para buscar vídeos, é preciso estar conectado.'
                  : restantes
                    ? restantes.restamHoje === 0
                      ? MENSAGENS_ERRO_VIDEOS[
                          restantes.limitadoPeloMes ? 'limite-mes' : 'limite-dia'
                        ]
                      : `${restantes.restamHoje === 1 ? 'Resta 1 busca' : `Restam ${restantes.restamHoje} buscas`} hoje.`
                    : ''}
              </span>
              <span aria-hidden="true">
                {termo.length}/{TAMANHO_MAXIMO_TERMO}
              </span>
            </div>
          </form>
        </Card>

        <AvisoYoutube />

        <p role="status" className="sr-only">
          {buscando
            ? 'Buscando vídeos.'
            : busca
              ? `${visiveis.length} ${visiveis.length === 1 ? 'vídeo encontrado' : 'vídeos encontrados'}.`
              : ''}
        </p>
        {erro && (
          <p role="alert" className="rounded-2xl bg-rosa px-5 py-4 text-lg font-semibold">
            {MENSAGENS_ERRO_VIDEOS[erro]}
          </p>
        )}

        {busca && !buscando && (
          <section aria-labelledby="titulo-resultados" className="flex flex-col gap-4">
            <h2 id="titulo-resultados" className="text-2xl font-extrabold">
              “{busca.termo}”
            </h2>
            {visiveis.length === 0 ? (
              <Card cor="sol">
                <p className="text-lg">
                  Nenhum vídeo encontrado para esse tema. Tente outras palavras, como o nome de um
                  bicho, de uma música ou de um assunto.
                </p>
              </Card>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiveis.map((video) => (
                  <li key={video.id}>
                    <button
                      type="button"
                      onClick={() => setAssistindo(video)}
                      className="flex w-full flex-col gap-3 rounded-3xl border-2 border-borda bg-white p-3 text-left shadow-suave hover:border-azul"
                    >
                      <span className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-ceu">
                        <img
                          src={video.miniatura}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="size-full object-cover"
                        />
                        <span
                          aria-label={duracaoPorExtenso(video.duracaoSeg)}
                          className="absolute right-2 bottom-2 rounded-lg bg-tinta/90 px-2 py-0.5 text-sm font-bold text-sobre-cor"
                        >
                          {formatarDuracaoVideo(video.duracaoSeg)}
                        </span>
                      </span>
                      <span className="line-clamp-2 px-1 text-lg font-bold">{video.titulo}</span>
                      <span className="px-1 text-sm text-tinta-suave">{video.canal}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </LayoutLogado>
  )
}
