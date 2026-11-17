import { describe, expect, it } from 'vitest'
import { cortarLote, plausivel, segmentar, textoDoLote } from './falas-lote.mjs'

const TAXA = 24000

/** Áudio sintético: [ms de som, ms de silêncio, ...]. O som é um tom de 220 Hz. */
function audio(partes) {
  const total = partes.reduce((n, ms) => n + Math.round((ms * TAXA) / 1000), 0)
  const amostras = new Int16Array(total)
  let pos = 0
  partes.forEach((ms, i) => {
    const n = Math.round((ms * TAXA) / 1000)
    if (i % 2 === 0) {
      for (let k = 0; k < n; k++)
        amostras[pos + k] = Math.round(9000 * Math.sin((2 * Math.PI * 220 * k) / TAXA))
    } else {
      for (let k = 0; k < n; k++) amostras[pos + k] = Math.round((Math.random() - 0.5) * 120) // ruído baixo
    }
    pos += n
  })
  return amostras
}

describe('cortar um lote de falas pelas pausas', () => {
  it('separa pelas pausas longas e ignora as pausas curtas dentro da fala', () => {
    // fala 1 tem uma pausa curta (300 ms) no meio: "Encontre os pares. Toque em duas cartas."
    const a = audio([900, 300, 1100, 1800, 700, 1800, 1500, 1800, 600])
    const trechos = cortarLote(a, TAXA, 4)
    expect(trechos).not.toBeNull()
    expect(trechos).toHaveLength(4)
    expect((trechos[0].fim - trechos[0].inicio) / TAXA).toBeGreaterThan(2.1)
  })

  it('devolve null quando a contagem não bate (ex.: o modelo juntou duas falas)', () => {
    const a = audio([900, 1800, 800, 200, 900])
    expect(cortarLote(a, TAXA, 3)).toBeNull()
  })

  it('ignora estalos curtos no silêncio', () => {
    const a = audio([800, 900, 40, 900, 800])
    expect(segmentar(a, TAXA, 700)).toHaveLength(2)
  })

  it('confere se a duração combina com o tamanho do texto', () => {
    const a = audio([1200, 1500, 600])
    const trechos = cortarLote(a, TAXA, 2)
    expect(plausivel(trechos, ['Encontre os pares.', 'Sim.'], TAXA)).toBe(true)
    expect(
      plausivel(trechos, ['Sim.', 'Encontre os pares iguais. Toque em duas cartas.'], TAXA),
    ).toBe(false)
  })

  it('monta o texto com uma fala por linha e pausas longas', () => {
    expect(textoDoLote(['Sim.', 'Não.'])).toBe('Sim.\n<long pause> <long pause>\nNão.')
  })
})
