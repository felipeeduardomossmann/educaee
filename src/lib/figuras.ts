import { NOMES_FIGURAS } from './nomes-figuras'

export type NomeFigura = (typeof NOMES_FIGURAS)[number]

// URLs das figuras (Fluent Emoji Flat). Para adicionar figuras, veja scripts/baixar-figuras.mjs.
const urls = import.meta.glob<string>('../assets/figuras/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

export function urlFigura(nome: NomeFigura): string {
  const url = urls[`../assets/figuras/${nome}.svg`]
  if (!url) throw new Error(`Figura não encontrada: ${nome}`)
  return url
}
