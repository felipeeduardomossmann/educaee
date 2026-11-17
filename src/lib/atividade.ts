/** Identificadores das atividades (iguais aos permitidos nas regras do Firestore). */
export const ATIVIDADES_IDS = [
  'memoria',
  'igual',
  'alvo',
  'letras',
  'sequencia',
  'emocoes',
  'contar',
  'caminhos',
  'pares',
  'pegue',
  'segure',
  'sombra',
  'faltando',
  'sons',
  'monte',
  'rotina',
] as const

/** Atividades cujos níveis são gravados no cadastro (compatível com regras antigas). */
export const ATIVIDADES_ORIGINAIS = ['memoria', 'igual', 'alvo', 'letras', 'sequencia'] as const

export type AtividadeId = (typeof ATIVIDADES_IDS)[number]

export const NIVEL_MINIMO = 1
export const NIVEL_MAXIMO = 4

export type Niveis = Record<AtividadeId, number>

/** Todo aluno novo começa no nível 1 em todas as atividades. */
export const NIVEIS_INICIAIS = Object.fromEntries(ATIVIDADES_IDS.map((id) => [id, 1])) as Niveis

/** O que vai para o banco ao cadastrar um aluno (veja ATIVIDADES_ORIGINAIS). */
export const NIVEIS_DO_CADASTRO = Object.fromEntries(
  ATIVIDADES_ORIGINAIS.map((id) => [id, 1]),
) as Record<(typeof ATIVIDADES_ORIGINAIS)[number], number>

/** Lê os níveis vindos do banco, trocando valores ausentes ou inválidos por 1. */
export function lerNiveis(dados: unknown): Niveis {
  const n = typeof dados === 'object' && dados !== null ? (dados as Record<string, unknown>) : {}
  const niveis = { ...NIVEIS_INICIAIS }
  for (const id of ATIVIDADES_IDS) {
    const valor = n[id]
    if (Number.isInteger(valor) && Number(valor) >= NIVEL_MINIMO && Number(valor) <= NIVEL_MAXIMO) {
      niveis[id] = Number(valor)
    }
  }
  return niveis
}
