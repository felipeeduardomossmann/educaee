import { describe, expect, it } from 'vitest'
import { escolherAuthDomain } from './auth-dominio'
import { codigoDoErro, mensagemErroLogin } from './erros-auth'

const PADRAO = 'projeto.firebaseapp.com'

describe('escolherAuthDomain', () => {
  it('usa o authDomain padrão em localhost', () => {
    expect(escolherAuthDomain('localhost:5173', PADRAO)).toBe(PADRAO)
    expect(escolherAuthDomain('127.0.0.1:4173', PADRAO)).toBe(PADRAO)
  })

  it('usa o próprio domínio do site em produção', () => {
    expect(escolherAuthDomain('www.educaee.com.br', PADRAO)).toBe('www.educaee.com.br')
    expect(escolherAuthDomain('educaee.vercel.app', PADRAO)).toBe('educaee.vercel.app')
  })
})

describe('mensagemErroLogin', () => {
  it('não mostra nada quando a pessoa fecha o popup', () => {
    expect(mensagemErroLogin('auth/popup-closed-by-user')).toBeNull()
    expect(mensagemErroLogin('auth/cancelled-popup-request')).toBeNull()
  })

  it('explica a falta de internet', () => {
    expect(mensagemErroLogin('auth/network-request-failed')).toMatch(/internet/)
  })

  it('tem uma mensagem genérica para erros desconhecidos', () => {
    expect(mensagemErroLogin('auth/qualquer-coisa')).toBe('Não foi possível entrar. Tente de novo.')
  })
})

describe('codigoDoErro', () => {
  it('lê o código de erros do Firebase', () => {
    expect(codigoDoErro({ code: 'auth/popup-blocked' })).toBe('auth/popup-blocked')
  })

  it('devolve texto vazio para outros erros', () => {
    expect(codigoDoErro(new Error('x'))).toBe('')
    expect(codigoDoErro(null)).toBe('')
  })
})
