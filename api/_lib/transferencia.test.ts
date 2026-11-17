import { describe, expect, it } from 'vitest'
import {
  ALFABETO_CODIGO,
  cartoesProprios,
  chaveHora,
  contarTentativa,
  emLotes,
  gerarCodigo,
  motivoInvalido,
  normalizarCodigo,
  primeiroNome,
  remapearPrancha,
  TENTATIVAS_POR_DIA,
  TENTATIVAS_POR_HORA,
  TENTATIVAS_POR_MES,
  VALIDADE_MS,
} from './transferencia.js'

describe('código', () => {
  it('tem 6 caracteres sem ambiguidade (sem 0, O, 1, I, L)', () => {
    for (const proibido of ['0', 'O', '1', 'I', 'L'])
      expect(ALFABETO_CODIGO).not.toContain(proibido)
    let i = 0
    const codigo = gerarCodigo((max) => i++ % max)
    expect(codigo).toHaveLength(6)
    expect([...codigo].every((c) => ALFABETO_CODIGO.includes(c))).toBe(true)
  })

  it('normaliza o que a pessoa digita', () => {
    expect(normalizarCodigo(' abc-234 ')).toBe('ABC234')
    expect(normalizarCodigo('ABC23')).toBeNull()
    expect(normalizarCodigo('ABC2O4')).toBeNull()
    expect(normalizarCodigo(123456)).toBeNull()
  })

  it('só vale se existir, não estiver usado nem vencido, e não for da própria pessoa', () => {
    const agora = 1_000_000
    const dados = {
      origemUid: 'a',
      alunoId: 'x',
      remover: false,
      expiraEm: agora + VALIDADE_MS,
      usado: false,
    }
    expect(motivoInvalido(dados, 'b', agora)).toBeNull()
    expect(motivoInvalido(dados, 'a', agora)).toBe('proprio-aluno')
    expect(motivoInvalido({ ...dados, usado: true }, 'b', agora)).toBe('codigo-invalido')
    expect(motivoInvalido({ ...dados, expiraEm: agora }, 'b', agora)).toBe('codigo-invalido')
    expect(motivoInvalido(null, 'b', agora)).toBe('codigo-invalido')
  })
})

describe('apoio', () => {
  it('janela de uma hora, primeiro nome e lotes', () => {
    expect(chaveHora(new Date('2026-11-02T14:59:00Z'))).toBe('2026-11-02T14')
    expect(primeiroNome('Maria Clara Souza')).toBe('Maria')
    expect(primeiroNome('')).toBe('uma professora')
    expect(emLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('remapeia os cartões próprios da prancha e tira os que não foram copiados', () => {
    const prancha = { cartoes: ['p:agua', 'c:velho', 'c:sumiu'], porTela: 4 }
    expect(cartoesProprios(prancha)).toEqual(['velho', 'sumiu'])
    expect(remapearPrancha(prancha, new Map([['velho', 'novo']]))).toEqual({
      cartoes: ['p:agua', 'c:novo'],
      porTela: 4,
    })
    expect(remapearPrancha(null, new Map())).toBeNull()
  })
})

describe('limite de tentativas', () => {
  const janelas = { hora: '2026-11-16T14', dia: '2026-11-16', mes: '2026-11' }

  it('a primeira tentativa abre as três janelas', () => {
    expect(contarTentativa(undefined, janelas)).toEqual({
      ok: true,
      contagem: { ...janelas, quantidade: 1, noDia: 1, noMes: 1 },
    })
  })

  it('soma dentro das janelas e recomeça quando elas viram', () => {
    const dados = { ...janelas, quantidade: 3, noDia: 8, noMes: 20 }
    expect(contarTentativa(dados, janelas)).toEqual({
      ok: true,
      contagem: { ...janelas, quantidade: 4, noDia: 9, noMes: 21 },
    })
    const outroDia = { hora: '2026-11-17T10', dia: '2026-11-17', mes: '2026-11' }
    expect(contarTentativa(dados, outroDia)).toEqual({
      ok: true,
      contagem: { ...outroDia, quantidade: 1, noDia: 1, noMes: 21 },
    })
  })

  it('bloqueia na hora, no dia e no mês (o mês tem prioridade)', () => {
    const base = { ...janelas, quantidade: 0, noDia: 0, noMes: 0 }
    const motivo = (dados: object) => {
      const r = contarTentativa({ ...base, ...dados }, janelas)
      return r.ok ? null : r.motivo
    }
    expect(motivo({ quantidade: TENTATIVAS_POR_HORA - 1 })).toBeNull()
    expect(motivo({ quantidade: TENTATIVAS_POR_HORA })).toBe('limite-tentativas')
    expect(motivo({ noDia: TENTATIVAS_POR_DIA })).toBe('limite-tentativas-dia')
    expect(motivo({ noMes: TENTATIVAS_POR_MES })).toBe('limite-tentativas-mes')
    expect(
      motivo({
        quantidade: TENTATIVAS_POR_HORA,
        noDia: TENTATIVAS_POR_DIA,
        noMes: TENTATIVAS_POR_MES,
      }),
    ).toBe('limite-tentativas-mes')
  })

  it('aceita o documento antigo, que só tinha a hora', () => {
    expect(contarTentativa({ hora: janelas.hora, quantidade: 2 }, janelas)).toEqual({
      ok: true,
      contagem: { ...janelas, quantidade: 3, noDia: 1, noMes: 1 },
    })
  })
})
