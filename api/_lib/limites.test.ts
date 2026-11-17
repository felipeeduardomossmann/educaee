import { describe, expect, it } from 'vitest'
import { ehRecusa } from './gemini.js'
import {
  calcularRestantes,
  chaveDia,
  chaveMes,
  LIMITES_ANALISES,
  LIMITES_DESENHOS,
  LIMITES_VIDEOS,
  motivoBloqueio,
} from './limites.js'

describe('datas no horário de Brasília', () => {
  it('o dia só vira à meia-noite de Brasília (03:00 UTC)', () => {
    expect(chaveDia(new Date('2026-11-03T02:59:00Z'))).toBe('2026-11-02')
    expect(chaveDia(new Date('2026-11-03T03:00:00Z'))).toBe('2026-11-03')
  })

  it('o mês vira no dia 1 à meia-noite de Brasília', () => {
    expect(chaveMes(new Date('2026-12-01T02:59:00Z'))).toBe('2026-11')
    expect(chaveMes(new Date('2026-12-01T03:00:00Z'))).toBe('2026-12')
    expect(chaveMes(new Date('2027-01-01T03:00:00Z'))).toBe('2027-01')
  })
})

describe('limites dos desenhos (10 por dia, 150 por mês)', () => {
  const L = LIMITES_DESENHOS

  it('bloqueia no limite do dia e no do mês (o do mês tem prioridade)', () => {
    expect(motivoBloqueio({ usadosHoje: 0, totalMes: 0 }, L)).toBeNull()
    expect(motivoBloqueio({ usadosHoje: 9, totalMes: 0 }, L)).toBeNull()
    expect(motivoBloqueio({ usadosHoje: 10, totalMes: 0 }, L)).toBe('limite-dia')
    expect(motivoBloqueio({ usadosHoje: 0, totalMes: 150 }, L)).toBe('limite-mes')
    expect(motivoBloqueio({ usadosHoje: 10, totalMes: 150 }, L)).toBe('limite-mes')
  })

  it('restam hoje = o menor entre o que sobra do dia e do mês', () => {
    expect(calcularRestantes({ usadosHoje: 4, totalMes: 20 }, L)).toEqual({
      restamHoje: 6,
      limitadoPeloMes: false,
    })
    expect(calcularRestantes({ usadosHoje: 0, totalMes: 147 }, L)).toEqual({
      restamHoje: 3,
      limitadoPeloMes: true,
    })
    expect(calcularRestantes({ usadosHoje: 12, totalMes: 999 }, L)).toEqual({
      restamHoje: 0,
      limitadoPeloMes: true,
    })
  })
})

describe('limites das análises (20 por dia, 1.000 por mês)', () => {
  const L = LIMITES_ANALISES

  it('bloqueia no limite do dia e no do mês (o do mês tem prioridade)', () => {
    expect(motivoBloqueio({ usadosHoje: 19, totalMes: 999 }, L)).toBeNull()
    expect(motivoBloqueio({ usadosHoje: 20, totalMes: 0 }, L)).toBe('limite-dia')
    expect(motivoBloqueio({ usadosHoje: 0, totalMes: 1000 }, L)).toBe('limite-mes')
    expect(motivoBloqueio({ usadosHoje: 20, totalMes: 1000 }, L)).toBe('limite-mes')
  })

  it('restam hoje considera o que sobra do mês', () => {
    expect(calcularRestantes({ usadosHoje: 5, totalMes: 100 }, L)).toEqual({
      restamHoje: 15,
      limitadoPeloMes: false,
    })
    expect(calcularRestantes({ usadosHoje: 0, totalMes: 995 }, L)).toEqual({
      restamHoje: 5,
      limitadoPeloMes: true,
    })
    expect(calcularRestantes({ usadosHoje: 0, totalMes: 1000 }, L)).toEqual({
      restamHoje: 0,
      limitadoPeloMes: true,
    })
  })
})

describe('sem limite mensal', () => {
  it('só o limite do dia vale', () => {
    const L = { porDia: 3, porMes: null }
    expect(motivoBloqueio({ usadosHoje: 2, totalMes: 99_999 }, L)).toBeNull()
    expect(calcularRestantes({ usadosHoje: 1, totalMes: 99_999 }, L)).toEqual({
      restamHoje: 2,
      limitadoPeloMes: false,
    })
  })
})

describe('limites dos vídeos (20 por dia, 600 por mês por usuário)', () => {
  const L = LIMITES_VIDEOS

  it('o limite mensal é 30 vezes o diário', () => {
    expect(L.porUsuarioMes).toBe(30 * L.porDia)
  })

  it('bloqueia no limite do dia e no do mês do usuário', () => {
    expect(motivoBloqueio({ usadosHoje: 19, totalMes: 0, usadosNoMes: 599 }, L)).toBeNull()
    expect(motivoBloqueio({ usadosHoje: 20, totalMes: 0, usadosNoMes: 100 }, L)).toBe('limite-dia')
    expect(motivoBloqueio({ usadosHoje: 0, totalMes: 0, usadosNoMes: 600 }, L)).toBe('limite-mes')
    expect(motivoBloqueio({ usadosHoje: 20, totalMes: 0, usadosNoMes: 600 }, L)).toBe('limite-mes')
  })

  it('o total do site não limita os vídeos', () => {
    expect(motivoBloqueio({ usadosHoje: 0, totalMes: 99_999, usadosNoMes: 0 }, L)).toBeNull()
  })

  it('restam hoje considera o que sobra do mês do usuário', () => {
    expect(calcularRestantes({ usadosHoje: 5, totalMes: 0, usadosNoMes: 100 }, L)).toEqual({
      restamHoje: 15,
      limitadoPeloMes: false,
    })
    expect(calcularRestantes({ usadosHoje: 0, totalMes: 0, usadosNoMes: 595 }, L)).toEqual({
      restamHoje: 5,
      limitadoPeloMes: true,
    })
    expect(calcularRestantes({ usadosHoje: 0, totalMes: 0, usadosNoMes: 600 }, L)).toEqual({
      restamHoje: 0,
      limitadoPeloMes: true,
    })
  })

  it('sem o contador do mês, conta como zero', () => {
    expect(calcularRestantes({ usadosHoje: 2, totalMes: 0 }, L)).toEqual({
      restamHoje: 18,
      limitadoPeloMes: false,
    })
  })
})

describe('recusas do Gemini', () => {
  it('reconhece as recusas pelos códigos de erro', () => {
    expect(ehRecusa({ error: { code: 'safety', message: '...' } })).toBe(true)
    expect(ehRecusa({ error: { code: 'prohibited_content' } })).toBe(true)
    expect(ehRecusa({ error: { code: 'invalid_request' } })).toBe(false)
    expect(ehRecusa(null)).toBe(false)
  })
})
