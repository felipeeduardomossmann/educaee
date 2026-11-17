// Carrega a IFrame API do YouTube uma vez só (script oficial) e expõe tipos mínimos.
// Os vídeos usam o domínio youtube-nocookie.com (modo de privacidade aprimorada).

export const ESTADO = { TERMINOU: 0, TOCANDO: 1, PAUSADO: 2, CARREGANDO: 3 } as const

export interface PlayerYoutube {
  playVideo(): void
  pauseVideo(): void
  destroy(): void
  getIframe(): HTMLIFrameElement
}

interface OpcoesPlayer {
  host: string
  videoId: string
  width: string
  height: string
  playerVars: Record<string, string | number>
  events: {
    onReady?: () => void
    onStateChange?: (evento: { data: number }) => void
    onError?: (evento: { data: number }) => void
  }
}

interface ApiYoutube {
  Player: new (elemento: HTMLElement, opcoes: OpcoesPlayer) => PlayerYoutube
}

declare global {
  interface Window {
    YT?: ApiYoutube & { loaded?: number }
    onYouTubeIframeAPIReady?: () => void
  }
}

let carregamento: Promise<ApiYoutube> | null = null

export function carregarApiYoutube(): Promise<ApiYoutube> {
  if (window.YT?.Player && window.YT.loaded) return Promise.resolve(window.YT)
  carregamento ??= new Promise<ApiYoutube>((resolver, rejeitar) => {
    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      anterior?.()
      if (window.YT) resolver(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      carregamento = null
      script.remove()
      rejeitar(new Error('Não foi possível carregar o player do YouTube'))
    }
    document.head.append(script)
  })
  return carregamento
}

/** Cria o player (rel=0, sem anotações, interface em português). */
export function criarPlayer(
  api: ApiYoutube,
  alvo: HTMLElement,
  videoId: string,
  eventos: OpcoesPlayer['events'],
): PlayerYoutube {
  return new api.Player(alvo, {
    host: 'https://www.youtube-nocookie.com',
    videoId,
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0,
      playsinline: 1,
      iv_load_policy: 3,
      fs: 1,
      hl: 'pt-BR',
      cc_lang_pref: 'pt',
      origin: window.location.origin,
    },
    events: eventos,
  })
}
