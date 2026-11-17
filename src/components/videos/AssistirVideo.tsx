import { useEffect, useRef, useState } from 'react'
import { duracaoPorExtenso, formatarDuracaoVideo, type Video } from '../../lib/videos'
import {
  carregarApiYoutube,
  criarPlayer,
  ESTADO,
  type PlayerYoutube,
} from '../../lib/youtube-player'
import Botao from '../Botao'
import Figura from '../Figura'
import Modal from '../Modal'
import AvisoYoutube from './AvisoYoutube'

type Situacao = 'carregando' | 'tocando' | 'pausado' | 'fim' | 'erro'

interface AssistirVideoProps {
  video: Video
  aoVoltar: () => void
  aoEsconder: () => Promise<void>
}

/** Player do YouTube com controles fora dele; ao terminar, o player sai da página. */
export default function AssistirVideo({ video, aoVoltar, aoEsconder }: AssistirVideoProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerYoutube | null>(null)
  const [situacao, setSituacao] = useState<Situacao>('carregando')
  const [rodada, setRodada] = useState(0)
  const [confirmarEsconder, setConfirmarEsconder] = useState(false)
  const [escondendo, setEscondendo] = useState(false)
  const [erroEsconder, setErroEsconder] = useState(false)
  const mostrandoPlayer = situacao !== 'fim' && situacao !== 'erro'

  useEffect(() => {
    const area = areaRef.current
    if (!area || !mostrandoPlayer) return
    let ativo = true
    // O YouTube troca este elemento pelo iframe; o React não mexe nele.
    const alvo = document.createElement('div')
    area.append(alvo)
    carregarApiYoutube()
      .then((api) => {
        if (!ativo) return
        playerRef.current = criarPlayer(api, alvo, video.id, {
          onStateChange: ({ data }) => {
            if (data === ESTADO.TOCANDO) setSituacao('tocando')
            else if (data === ESTADO.PAUSADO) setSituacao('pausado')
            else if (data === ESTADO.TERMINOU) {
              if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
              setSituacao('fim')
            }
          },
          onReady: () => setSituacao((atual) => (atual === 'carregando' ? 'pausado' : atual)),
          onError: () => setSituacao('erro'),
        })
      })
      .catch(() => {
        if (ativo) setSituacao('erro')
      })
    return () => {
      ativo = false
      playerRef.current?.destroy()
      playerRef.current = null
      area.replaceChildren()
    }
    // `rodada` recria o player em "Assistir de novo".
  }, [video.id, rodada, mostrandoPlayer])

  const alternarPausa = () => {
    const player = playerRef.current
    if (!player) return
    if (situacao === 'tocando') player.pauseVideo()
    else player.playVideo()
  }

  const telaCheia = () => {
    void playerRef.current
      ?.getIframe()
      .requestFullscreen()
      .catch(() => {})
  }

  const assistirDeNovo = () => {
    setSituacao('carregando')
    setRodada((n) => n + 1)
  }

  const esconder = async () => {
    setEscondendo(true)
    setErroEsconder(false)
    try {
      await aoEsconder()
      setConfirmarEsconder(false)
      aoVoltar()
    } catch (falha) {
      console.warn(falha)
      setErroEsconder(true)
    } finally {
      setEscondendo(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Botao variante="secundario" tamanho="grande" onClick={aoVoltar}>
          <Figura nome="porta" alt="" className="size-7" />
          Voltar
        </Botao>
        {mostrandoPlayer && (
          <>
            <Botao
              variante="secundario"
              tamanho="grande"
              onClick={alternarPausa}
              disabled={situacao === 'carregando'}
            >
              <Figura
                nome={situacao === 'tocando' ? 'pausar' : 'continuar'}
                alt=""
                className="size-7"
              />
              {situacao === 'tocando' ? 'Pausar' : 'Continuar'}
            </Botao>
            <Botao
              variante="secundario"
              tamanho="grande"
              onClick={telaCheia}
              disabled={situacao === 'carregando'}
            >
              <Figura nome="televisao" alt="" className="size-7" />
              Tela cheia
            </Botao>
          </>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-extrabold">{video.titulo}</h1>
        <p className="text-tinta-suave">
          {video.canal} ·{' '}
          <span aria-label={duracaoPorExtenso(video.duracaoSeg)}>
            {formatarDuracaoVideo(video.duracaoSeg)}
          </span>
        </p>
      </div>

      {/* Tamanho grande, mas sem passar da altura da tela. */}
      <div className="mx-auto aspect-video w-full max-w-[calc((100dvh-16rem)*16/9)] min-w-0 overflow-hidden rounded-2xl bg-tinta">
        {mostrandoPlayer ? (
          // As keys fazem o React trocar o elemento (e não reaproveitar a div do player, que o
          // YouTube preenche e a limpeza esvazia).
          <div key={`player-${rodada}`} ref={areaRef} className="size-full" />
        ) : (
          <div
            key="fim"
            className="flex size-full flex-col items-center justify-center gap-5 bg-ceu p-6 text-center"
          >
            <p role="status" className="text-2xl font-extrabold">
              {situacao === 'fim' ? 'Fim do vídeo!' : 'Este vídeo não pode ser exibido aqui.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {situacao === 'fim' && (
                <Botao tamanho="grande" onClick={assistirDeNovo}>
                  <Figura nome="continuar" alt="" className="size-7" />
                  Assistir de novo
                </Botao>
              )}
              <Botao variante="secundario" tamanho="grande" onClick={aoVoltar}>
                Escolher outro vídeo
              </Botao>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AvisoYoutube />
        <Botao variante="suave" onClick={() => setConfirmarEsconder(true)}>
          <Figura nome="proibido" alt="" className="size-5" />
          Esconder este vídeo
        </Botao>
      </div>

      <Modal
        aberto={confirmarEsconder}
        titulo="Esconder este vídeo?"
        aoFechar={() => setConfirmarEsconder(false)}
        podeFechar={!escondendo}
        acoes={
          <>
            <Botao
              variante="secundario"
              onClick={() => setConfirmarEsconder(false)}
              disabled={escondendo}
            >
              Cancelar
            </Botao>
            <Botao onClick={() => void esconder()} disabled={escondendo}>
              {escondendo ? 'Escondendo…' : 'Esconder'}
            </Botao>
          </>
        }
      >
        <p>
          Ele não vai mais aparecer nas suas buscas. Só você deixa de ver; nada muda no YouTube.
        </p>
        {erroEsconder && (
          <p role="alert" className="mt-3 font-semibold text-vermelho">
            Não foi possível esconder agora. Verifique a internet e tente de novo.
          </p>
        )}
      </Modal>
    </div>
  )
}
