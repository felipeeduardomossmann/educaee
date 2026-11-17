import { describe, expect, it } from 'vitest'
import { Cronometro, formatarDuracao } from './cronometro'
import { escolherVozes, ordenarVozes, type VozDisponivel } from './voz'

describe('Cronometro', () => {
  it('não conta o tempo em pausa', () => {
    let agora = 0
    const cronometro = new Cronometro(() => agora)
    agora = 10_000
    cronometro.pausar()
    agora = 70_000 // 1 minuto pausado
    cronometro.continuar()
    agora = 75_000
    expect(cronometro.segundos()).toBe(15)
  })

  it('ignora pausar ou continuar repetidos', () => {
    let agora = 0
    const cronometro = new Cronometro(() => agora)
    agora = 5_000
    cronometro.pausar()
    cronometro.pausar()
    agora = 9_000
    expect(cronometro.segundos()).toBe(5)
    cronometro.continuar()
    cronometro.continuar()
    agora = 11_000
    expect(cronometro.segundos()).toBe(7)
  })
})

describe('formatarDuracao', () => {
  it('formata segundos e minutos', () => {
    expect(formatarDuracao(45)).toBe('45 s')
    expect(formatarDuracao(120)).toBe('2 min')
    expect(formatarDuracao(135)).toBe('2 min 15 s')
  })
})

function voz(name: string, lang: string, localService = false, padrao = false): VozDisponivel {
  return { name, lang, localService, default: padrao }
}

const MARIA = voz('Microsoft Maria - Portuguese (Brazil)', 'pt-BR', true, true)
const FRANCISCA = voz('Microsoft Francisca Online (Natural) - Portuguese (Brazil)', 'pt-BR')
const THALITA = voz('Microsoft Thalita Online (Natural) - Portuguese (Brazil)', 'pt-BR')
const GOOGLE = voz('Google português do Brasil', 'pt-BR')
const INGLES = voz('Microsoft Zira', 'en-US', true)

describe('ordenarVozes', () => {
  it('prefere Natural/Online da Microsoft, depois Google, e por último as locais', () => {
    const nomes = ordenarVozes([MARIA, GOOGLE, INGLES, FRANCISCA]).map((v) => v.name)
    expect(nomes).toEqual([FRANCISCA.name, GOOGLE.name, MARIA.name])
  })

  it('coloca pt-BR antes de outros portugueses, mesmo de qualidade menor', () => {
    const portugal = voz('Microsoft Raquel Online (Natural) - Portuguese (Portugal)', 'pt-PT')
    expect(ordenarVozes([portugal, MARIA])[0]?.name).toBe(MARIA.name)
  })

  it('aceita lang com sublinhado (Android/ChromeOS)', () => {
    expect(ordenarVozes([voz('Voz', 'pt_BR')])).toHaveLength(1)
  })
})

describe('escolherVozes', () => {
  it('separa a preferida (melhor qualidade) da local (reserva offline)', () => {
    const { preferida, local } = escolherVozes([MARIA, THALITA, GOOGLE])
    expect(preferida?.name).toBe(THALITA.name)
    expect(local?.name).toBe(MARIA.name)
  })

  it('sem voz local, a reserva fica vazia (usa a voz padrão do sistema)', () => {
    expect(escolherVozes([GOOGLE]).local).toBeNull()
  })

  it('sem português, não escolhe nada', () => {
    expect(escolherVozes([INGLES])).toEqual({ preferida: null, local: null })
  })
})
