import { registerSW } from 'virtual:pwa-register'

// A versão nova do site só é aplicada na próxima troca de página fora de uma atividade.

const UMA_HORA = 60 * 60 * 1000

let aplicar: (() => void) | null = null

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const atualizar = registerSW({
    onNeedRefresh() {
      aplicar = () => void atualizar(true)
    },
    onRegisteredSW(_url, registro) {
      // Abas que ficam abertas o dia todo também procuram versões novas.
      if (registro) setInterval(() => void registro.update().catch(() => {}), UMA_HORA)
    },
  })
}

/** Aplica a versão nova, se houver uma esperando. Devolve true se a página vai recarregar. */
export function aplicarAtualizacaoPendente(): boolean {
  if (!aplicar) return false
  const fazer = aplicar
  aplicar = null
  fazer()
  return true
}
