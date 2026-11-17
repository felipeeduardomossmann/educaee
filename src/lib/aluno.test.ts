import { describe, expect, it } from 'vitest'
import {
  LIMITE_NOME,
  limparDadosAluno,
  listarTurmas,
  ordenarAlunos,
  validarDadosAluno,
  type Aluno,
} from './aluno'
import { lerNiveis, NIVEIS_INICIAIS } from './atividade'
import { lerPerfil, PERFIL_PADRAO } from './perfil'
import { TEMAS } from './temas'

function aluno(nome: string, turma = ''): Aluno {
  return { id: nome, nome, turma, perfil: PERFIL_PADRAO, niveis: NIVEIS_INICIAIS }
}

describe('limparDadosAluno', () => {
  it('tira espaços das pontas e espaços repetidos', () => {
    const limpo = limparDadosAluno({
      nome: '  Ana   Clara ',
      turma: ' 3º  ano B ',
      perfil: PERFIL_PADRAO,
    })
    expect(limpo.nome).toBe('Ana Clara')
    expect(limpo.turma).toBe('3º ano B')
  })
})

describe('validarDadosAluno', () => {
  const valido = { nome: 'Ana', turma: '', perfil: PERFIL_PADRAO }

  it('aceita nome com turma vazia', () => {
    expect(validarDadosAluno(valido)).toEqual({})
  })

  it('exige o nome', () => {
    expect(validarDadosAluno({ ...valido, nome: '' }).nome).toBeDefined()
  })

  it('limita o nome a 40 e a turma a 30 caracteres', () => {
    expect(validarDadosAluno({ ...valido, nome: 'a'.repeat(LIMITE_NOME) })).toEqual({})
    expect(validarDadosAluno({ ...valido, nome: 'a'.repeat(41) }).nome).toBeDefined()
    expect(validarDadosAluno({ ...valido, turma: 'a'.repeat(31) }).turma).toBeDefined()
  })
})

describe('ordenarAlunos', () => {
  it('ordena em português, ignorando acentos e maiúsculas', () => {
    const nomes = ordenarAlunos([
      aluno('bruno'),
      aluno('Ágata'),
      aluno('Carlos'),
      aluno('ana'),
    ]).map((a) => a.nome)
    expect(nomes).toEqual(['Ágata', 'ana', 'bruno', 'Carlos'])
  })
})

describe('listarTurmas', () => {
  it('lista turmas diferentes, em ordem, sem a vazia', () => {
    const turmas = listarTurmas([
      aluno('A', '3º ano B'),
      aluno('B', '1º ano'),
      aluno('C', '3º ano B'),
      aluno('D'),
    ])
    expect(turmas).toEqual(['1º ano', '3º ano B'])
  })
})

describe('lerPerfil', () => {
  it('usa o padrão para valores ausentes ou inválidos', () => {
    expect(lerPerfil(undefined)).toEqual(PERFIL_PADRAO)
    expect(lerPerfil({ tamanho: 'enorme', sons: 'sim', tema: 'frutas' })).toEqual({
      ...PERFIL_PADRAO,
      tema: 'frutas',
    })
  })
})

describe('lerNiveis', () => {
  it('mantém níveis válidos e troca os inválidos por 1', () => {
    expect(lerNiveis({ memoria: 3, igual: 9, alvo: 2.5, letras: '2' })).toEqual({
      ...NIVEIS_INICIAIS,
      memoria: 3,
    })
  })
})

describe('TEMAS', () => {
  it.each(Object.entries(TEMAS))('o tema %s tem pelo menos 12 figuras diferentes', (_, tema) => {
    expect(tema.figuras.length).toBeGreaterThanOrEqual(12)
    expect(new Set(tema.figuras).size).toBe(tema.figuras.length)
  })
})
