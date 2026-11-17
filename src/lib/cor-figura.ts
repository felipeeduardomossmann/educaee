import { urlFigura, type NomeFigura } from './figuras'

export type Rgb = readonly [number, number, number]

const LADO_AMOSTRA = 24
const cache = new Map<NomeFigura, Promise<Rgb>>()

/** Cor predominante de uma figura, medida num canvas (só no navegador). */
export function corDaFigura(nome: NomeFigura): Promise<Rgb> {
  const emCache = cache.get(nome)
  if (emCache) return emCache
  const promessa = new Promise<Rgb>((resolver, rejeitar) => {
    const imagem = new Image(LADO_AMOSTRA, LADO_AMOSTRA)
    imagem.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = LADO_AMOSTRA
      canvas.height = LADO_AMOSTRA
      const contexto = canvas.getContext('2d')
      if (!contexto) return rejeitar(new Error('Canvas indisponível'))
      contexto.drawImage(imagem, 0, 0, LADO_AMOSTRA, LADO_AMOSTRA)
      const { data } = contexto.getImageData(0, 0, LADO_AMOSTRA, LADO_AMOSTRA)
      resolver(mediaDosPixels(data))
    }
    imagem.onerror = () => rejeitar(new Error(`Não foi possível carregar ${nome}`))
    imagem.src = urlFigura(nome)
  })
  cache.set(nome, promessa)
  return promessa
}

/** Média dos pixels opacos, ignorando os quase pretos (contornos e olhos). */
export function mediaDosPixels(dados: ArrayLike<number>): Rgb {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i + 3 < dados.length; i += 4) {
    const [pr, pg, pb, alfa] = [
      dados[i] ?? 0,
      dados[i + 1] ?? 0,
      dados[i + 2] ?? 0,
      dados[i + 3] ?? 0,
    ]
    if (alfa < 200 || Math.max(pr, pg, pb) < 50) continue
    r += pr
    g += pg
    b += pb
    n++
  }
  return n === 0 ? [128, 128, 128] : [r / n, g / n, b / n]
}

/** Distância entre cores parecida com a percepção humana ("redmean"). */
export function distanciaCor([r1, g1, b1]: Rgb, [r2, g2, b2]: Rgb): number {
  const mediaR = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(
    (2 + mediaR / 256) * dr * dr + 4 * dg * dg + (2 + (255 - mediaR) / 256) * db * db,
  )
}
