import { describe, expect, it } from 'vitest'
import { duracaoPorExtenso, formatarDuracaoVideo, semEscondidos, type Video } from './videos'

describe('duração dos vídeos', () => {
  it('formata como no YouTube', () => {
    expect(formatarDuracaoVideo(200)).toBe('3:20')
    expect(formatarDuracaoVideo(59)).toBe('0:59')
    expect(formatarDuracaoVideo(3723)).toBe('1:02:03')
  })

  it('escreve por extenso para leitores de tela', () => {
    expect(duracaoPorExtenso(200)).toBe('3 minutos e 20 segundos')
    expect(duracaoPorExtenso(60)).toBe('1 minuto')
    expect(duracaoPorExtenso(1)).toBe('1 segundo')
  })
})

describe('semEscondidos', () => {
  it('tira os vídeos escondidos pela professora', () => {
    const video = (id: string): Video => ({
      id,
      titulo: id,
      canal: 'c',
      duracaoSeg: 10,
      miniatura: 'https://x',
    })
    expect(
      semEscondidos([video('a'), video('b'), video('c')], new Set(['b'])).map((v) => v.id),
    ).toEqual(['a', 'c'])
  })
})
