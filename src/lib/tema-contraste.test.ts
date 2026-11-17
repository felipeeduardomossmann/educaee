/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

/** Lê as cores do index.css: as do tema claro (@theme) e as do modo escuro. */
function lerPaletas() {
  const pegar = (trecho: string) =>
    Object.fromEntries(
      [...trecho.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
    )
  const claro: Record<string, string> = {
    white: '#ffffff',
    ...pegar(css.split('@media screen')[0]),
  }
  const blocoEscuro = css.match(/html\[data-tema='escuro'\] \{([^}]*)\}/)?.[1] ?? ''
  const escuro: Record<string, string> = { ...claro, ...pegar(blocoEscuro) }
  return { claro, escuro }
}

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const FUNDOS = ['creme', 'white', 'ceu', 'menta', 'pessego', 'lilas', 'sol', 'rosa']

/** [texto, fundos, mínimo]: 4,5 para texto comum, 3 para texto grande e contornos. */
const PARES: [string, string[], number][] = [
  ['tinta', FUNDOS, 4.5],
  ['tinta-suave', FUNDOS, 4.5],
  ['azul-escuro', ['creme', 'white', 'ceu'], 4.5],
  ['azul', ['creme', 'white'], 4.5],
  ['vermelho', ['creme', 'white', 'rosa'], 4.5],
  ['sobre-cor', ['azul', 'azul-escuro', 'verde', 'vermelho', 'tinta'], 4.5],
  ['coral', ['creme', 'white'], 3],
  ['azul', ['creme', 'white', 'ceu'], 3],
  ['verde', ['creme', 'white'], 3],
]

describe.each(Object.entries(lerPaletas()))('contrastes do tema %s', (_, paleta) => {
  it.each(PARES)('%s sobre %j', (texto, fundos, minimo) => {
    for (const fundo of fundos) {
      const valor = contraste(paleta[texto], paleta[fundo])
      expect(valor, `${texto} sobre ${fundo}: ${valor.toFixed(2)}`).toBeGreaterThanOrEqual(minimo)
    }
  })
})
