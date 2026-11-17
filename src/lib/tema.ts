import { useSyncExternalStore } from 'react'

/** Escolha da pessoa no seletor do topo. "auto" segue o sistema. */
export type PreferenciaTema = 'claro' | 'escuro' | 'auto'
/** O tema que está de fato na tela. */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'educaee:tema'
const COR_BARRA: Record<Tema, string> = { claro: '#fffaf2', escuro: '#131a23' }

const consultaEscuro =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function lerPreferencia(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CHAVE)
    if (valor === 'escuro' || valor === 'auto' || valor === 'claro') return valor
  } catch {
    // Navegador sem armazenamento (ex.: janela privada bloqueada): vale o padrão.
  }
  return 'claro'
}

let preferencia: PreferenciaTema = lerPreferencia()
const ouvintes = new Set<() => void>()

/** Resolve "auto" pelo sistema. Função pura, testada. */
export function resolverTema(pref: PreferenciaTema, sistemaEscuro: boolean): Tema {
  if (pref === 'auto') return sistemaEscuro ? 'escuro' : 'claro'
  return pref
}

function temaAtual(): Tema {
  return resolverTema(preferencia, consultaEscuro?.matches ?? false)
}

/** Aplica o tema no <html> (data-tema), nos controles nativos e na barra do navegador. */
function aplicar() {
  if (typeof document === 'undefined') return
  const tema = temaAtual()
  const raiz = document.documentElement
  if (tema === 'escuro') raiz.dataset.tema = 'escuro'
  else delete raiz.dataset.tema
  raiz.style.colorScheme = tema === 'escuro' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema])
}

function avisar() {
  aplicar()
  ouvintes.forEach((ouvinte) => ouvinte())
}

consultaEscuro?.addEventListener('change', () => {
  if (preferencia === 'auto') avisar()
})
aplicar()

export function mudarPreferenciaTema(nova: PreferenciaTema) {
  preferencia = nova
  try {
    localStorage.setItem(CHAVE, nova)
  } catch {
    // Sem armazenamento: vale só até recarregar.
  }
  avisar()
}

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar)
  return () => ouvintes.delete(aoMudar)
}

export function usePreferenciaTema(): PreferenciaTema {
  return useSyncExternalStore(assinar, () => preferencia)
}

/** O tema efetivo (para cores que não vêm do CSS, como gráficos e SVGs desenhados no código). */
export function useTema(): Tema {
  return useSyncExternalStore(assinar, temaAtual)
}
