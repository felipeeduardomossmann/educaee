import { useSyncExternalStore } from 'react'
import { AREA_TOQUE, type Perfil } from '../lib/perfil'
import { useTema } from '../lib/tema'

const consulta =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

function assinar(aoMudar: () => void) {
  consulta?.addEventListener('change', aoMudar)
  return () => consulta?.removeEventListener('change', aoMudar)
}

/** true se o sistema pede menos movimento (prefers-reduced-motion). */
function useMovimentoReduzidoNoSistema(): boolean {
  return useSyncExternalStore(assinar, () => consulta?.matches ?? false)
}

export interface Aparencia {
  /** Lado mínimo, em px, de botões, cartas e alvos. */
  areaToque: number
  altoContraste: boolean
  /** Modo escuro da tela (falso quando o alto contraste está ligado, que sempre prevalece). */
  escuro: boolean
  /** Perfil OU sistema pedem animações reduzidas. */
  animacoesReduzidas: boolean
  /** Classes de fundo e texto da tela da atividade. */
  classeTela: string
  /** Classes de um botão/carta/alvo que o aluno toca. */
  classeAlvo: string
}

/** Como a atividade deve aparecer para este perfil. */
export function useAparencia(perfil: Perfil): Aparencia {
  const sistemaReduzido = useMovimentoReduzidoNoSistema()
  const alto = perfil.contraste === 'alto'
  const tema = useTema()
  return {
    areaToque: AREA_TOQUE[perfil.tamanho],
    altoContraste: alto,
    escuro: !alto && tema === 'escuro',
    animacoesReduzidas: perfil.animacoesReduzidas || sistemaReduzido,
    classeTela: alto ? 'bg-ac-fundo text-ac-texto' : 'bg-creme text-tinta',
    classeAlvo: alto
      ? 'rounded-2xl border-4 border-ac-contorno bg-ac-fundo text-ac-texto'
      : 'rounded-2xl border-2 border-borda bg-white text-tinta shadow-suave',
  }
}
