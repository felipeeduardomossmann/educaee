import { describe, expect, it } from 'vitest'
import { resolverTema } from './tema'

describe('resolverTema', () => {
  it('respeita a escolha fixa', () => {
    expect(resolverTema('claro', true)).toBe('claro')
    expect(resolverTema('escuro', false)).toBe('escuro')
  })
  it('automático segue o sistema', () => {
    expect(resolverTema('auto', true)).toBe('escuro')
    expect(resolverTema('auto', false)).toBe('claro')
  })
})
