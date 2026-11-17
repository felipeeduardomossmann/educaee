import type { AnaliseSalva } from './analise'
import type { Niveis } from './atividade'
import type { ConfigPrancha } from '../prancha/prancha'
import type { Perfil } from './perfil'

export const LIMITE_NOME = 40
export const LIMITE_TURMA = 30

export interface Aluno {
  id: string
  nome: string
  turma: string
  perfil: Perfil
  niveis: Niveis
  /** Última análise feita com IA (só o texto com "o aluno"; o nome entra na exibição). */
  analise?: AnaliseSalva | null
  /** Prancha de comunicação personalizada (sem ela, vale a prancha padrão). */
  prancha?: ConfigPrancha | null
}

/** O que a professora preenche no formulário. */
export interface DadosAluno {
  nome: string
  turma: string
  perfil: Perfil
}

export interface ErrosAluno {
  nome?: string
  turma?: string
}

/** Tira espaços das pontas e espaços repetidos no meio. */
export function limparTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ')
}

export function limparDadosAluno(dados: DadosAluno): DadosAluno {
  return { ...dados, nome: limparTexto(dados.nome), turma: limparTexto(dados.turma) }
}

/** Valida os dados já limpos. Sem erros, devolve um objeto vazio. */
export function validarDadosAluno(dados: DadosAluno): ErrosAluno {
  const erros: ErrosAluno = {}
  if (dados.nome.length === 0) erros.nome = 'Escreva o nome ou apelido do aluno.'
  else if (dados.nome.length > LIMITE_NOME) erros.nome = `Use no máximo ${LIMITE_NOME} caracteres.`
  if (dados.turma.length > LIMITE_TURMA) erros.turma = `Use no máximo ${LIMITE_TURMA} caracteres.`
  return erros
}

const comparador = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

/** Ordem alfabética em português (ignora acentos e maiúsculas: "Ágata" vem antes de "Bruno"). */
export function ordenarAlunos(alunos: readonly Aluno[]): Aluno[] {
  return [...alunos].sort((a, b) => comparador.compare(a.nome, b.nome))
}

/** Turmas diferentes, em ordem, sem a turma vazia. */
export function listarTurmas(alunos: readonly Aluno[]): string[] {
  const turmas = new Set(alunos.map((aluno) => aluno.turma).filter((turma) => turma !== ''))
  return [...turmas].sort(comparador.compare)
}
