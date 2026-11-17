// Corta um áudio com várias falas (separadas por pausas longas) em um trecho por fala.
// Lógica pura, usada por scripts/gerar-falas.mjs e testada em falas-lote.test.mjs.

const QUADRO_MS = 20
/** Pausas mínimas tentadas, da mais longa para a mais curta (a 1ª que der a contagem certa vale). */
const PAUSAS_MS = [1200, 1000, 850, 700, 600, 500, 450]
/** Som mais curto que isto é ruído (estalo), não uma fala. */
const SOM_MINIMO_MS = 150

/** Volume (RMS) de cada quadro de 20 ms. */
export function volumes(amostras, taxa) {
  const tamanho = Math.round((taxa * QUADRO_MS) / 1000)
  const lista = []
  for (let i = 0; i < amostras.length; i += tamanho) {
    let soma = 0
    const fim = Math.min(amostras.length, i + tamanho)
    for (let j = i; j < fim; j++) soma += amostras[j] * amostras[j]
    lista.push(Math.sqrt(soma / Math.max(1, fim - i)))
  }
  return lista
}

/** Limiar de silêncio: uma fração do volume típico da fala (adapta-se ao áudio). */
export function limiarSilencio(vol) {
  const ordenados = [...vol].sort((a, b) => a - b)
  const p95 = ordenados[Math.floor(ordenados.length * 0.95)] ?? 0
  return Math.max(250, p95 * 0.06)
}

/** Trechos com som separados por silêncios de pelo menos `pausaMs` (em amostras). */
export function segmentar(
  amostras,
  taxa,
  pausaMs,
  limiar = limiarSilencio(volumes(amostras, taxa)),
) {
  const vol = volumes(amostras, taxa)
  const tamanho = Math.round((taxa * QUADRO_MS) / 1000)
  const pausaQuadros = Math.ceil(pausaMs / QUADRO_MS)
  const minimoQuadros = Math.ceil(SOM_MINIMO_MS / QUADRO_MS)
  const trechos = []
  let inicio = -1
  let ultimoSom = -1
  for (let q = 0; q <= vol.length; q++) {
    const som = q < vol.length && vol[q] >= limiar
    if (som) {
      if (inicio < 0) inicio = q
      ultimoSom = q
    } else if (inicio >= 0 && (q === vol.length || q - ultimoSom >= pausaQuadros)) {
      if (ultimoSom - inicio + 1 >= minimoQuadros) {
        trechos.push({
          inicio: inicio * tamanho,
          fim: Math.min(amostras.length, (ultimoSom + 1) * tamanho),
        })
      }
      inicio = -1
    }
  }
  return trechos
}

/** Corta em exatamente `quantidade` trechos; null se nenhuma pausa der certo. */
export function cortarLote(amostras, taxa, quantidade) {
  for (const pausa of PAUSAS_MS) {
    const trechos = segmentar(amostras, taxa, pausa)
    if (trechos.length === quantidade) return trechos
  }
  return null
}

/** Confere se a duração de cada trecho combina com o tamanho do texto. */
export function plausivel(trechos, textos, taxa) {
  if (trechos.length !== textos.length) return false
  return trechos.every(({ inicio, fim }, i) => {
    const segundos = (fim - inicio) / taxa
    const letras = Math.max(1, textos[i].replace(/[^\p{L}\p{N}]/gu, '').length)
    return segundos >= 0.25 && segundos / letras >= 0.03 && segundos / letras <= 0.4
  })
}

/** Texto do pedido: uma fala por linha, com pausa longa entre elas (não são lidos números). */
export function textoDoLote(textos) {
  return textos.join('\n<long pause> <long pause>\n')
}
