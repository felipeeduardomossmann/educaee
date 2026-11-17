import type { User } from 'firebase/auth'
import type { Aluno } from './aluno'
import {
  chamarApi,
  consultarRestantesApi,
  lerCodigoErro,
  lerRestantes,
  type CodigoErroApi,
  type Restantes,
} from './api'
import { ATIVIDADES_IDS } from './atividade'
import type { Periodo } from './progresso'
import type { Sessao } from './sessoes'
import { taxaAcerto } from './sugestao'

// Análise do progresso: só números vão para o servidor; o nome entra só na tela e no PDF.

export const AVISO_ANALISE =
  'Análise gerada automaticamente a partir dos resultados das atividades. Revise antes de compartilhar.'

/** Igual ao MAXIMO_RODADAS do servidor (api/_lib/analise.ts). */
export const MAXIMO_RODADAS = 60

export interface TextoAnalise {
  visaoGeral: string[]
  /** Pontos fortes (vazio nas análises antigas). */
  fortes: string[]
  atencao: string[]
  /** Evolução no período. */
  evoluiu: string[]
  sugestoes: string[]
}

/** As seções da análise, na ordem da tela e do PDF (a visão geral vem antes, sem título). */
export const SECOES_ANALISE = [
  ['Pontos fortes', 'fortes'],
  ['Pontos de atenção', 'atencao'],
  ['Evolução no período', 'evoluiu'],
  ['Sugestões para os próximos atendimentos', 'sugestoes'],
] as const satisfies readonly (readonly [string, keyof TextoAnalise])[]

export interface AnaliseSalva extends TextoAnalise {
  periodo: Periodo
  /** Rodadas do período quando a análise foi feita. */
  rodadas: number
  geradaEm: Date
}

export interface DadosAnalise {
  periodo: Periodo
  atividades: {
    atividade: string
    nivelAtual: number
    totalRodadas: number
    rodadas: { data: string; nivel: number; taxa: number }[]
  }[]
}

/** Data local do aparelho, como "2026-10-03". */
function dataLocal(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
}

/** Só os números do período, por atividade (recebe os níveis, não o nome). */
export function montarDadosAnalise(
  niveis: Aluno['niveis'],
  sessoesNoPeriodo: readonly Sessao[],
  periodo: Periodo,
): DadosAnalise {
  const atividades: DadosAnalise['atividades'] = []
  for (const atividade of ATIVIDADES_IDS) {
    const daAtividade = sessoesNoPeriodo
      .filter((s) => s.atividadeId === atividade)
      .sort((a, b) => a.concluidaEm.getTime() - b.concluidaEm.getTime())
    if (daAtividade.length === 0) continue
    atividades.push({
      atividade,
      nivelAtual: niveis[atividade],
      totalRodadas: daAtividade.length,
      rodadas: daAtividade.slice(-MAXIMO_RODADAS).map((s) => ({
        data: dataLocal(s.concluidaEm),
        nivel: s.nivel,
        taxa: Math.round(taxaAcerto(s) * 100),
      })),
    })
  }
  return { periodo, atividades }
}

const maiuscula = (inicial: string, palavra: string) =>
  inicial === inicial.toUpperCase() ? palavra[0].toUpperCase() + palavra.slice(1) : palavra

/** Troca "o aluno" (e "do aluno", "ao aluno"...) pelo nome. */
export function personalizar(texto: string, nome: string): string {
  return texto
    .replace(/\b([Dd])o aluno\b/g, (_, i: string) => `${maiuscula(i, 'de')} ${nome}`)
    .replace(/\b([Nn])o aluno\b/g, (_, i: string) => `${maiuscula(i, 'em')} ${nome}`)
    .replace(/\b([Aa])o aluno\b/g, (_, i: string) => `${maiuscula(i, 'a')} ${nome}`)
    .replace(/\b([Pp])elo aluno\b/g, (_, i: string) => `${maiuscula(i, 'por')} ${nome}`)
    .replace(/\b[Oo] aluno\b/g, nome)
}

export function personalizarAnalise(analise: TextoAnalise, nome: string): TextoAnalise {
  const trocar = (lista: string[]) => lista.map((texto) => personalizar(texto, nome))
  return {
    visaoGeral: trocar(analise.visaoGeral),
    fortes: trocar(analise.fortes),
    evoluiu: trocar(analise.evoluiu),
    atencao: trocar(analise.atencao),
    sugestoes: trocar(analise.sugestoes),
  }
}

export const MENSAGENS_ERRO_ANALISE: Record<CodigoErroApi, string> = {
  'sem-login': 'Sua sessão expirou. Saia e entre de novo para continuar.',
  'dados-invalidos': 'Não há rodadas neste período para analisar.',
  'limite-dia': 'Você já gerou todas as análises de hoje. Amanhã tem mais!',
  'limite-mes':
    'As análises deste mês acabaram para o site todo. Elas voltam no dia 1º do mês que vem.',
  recusado: 'Não foi possível gerar a análise. Tente de novo mais tarde.',
  falha: 'Não foi possível gerar a análise agora. Verifique a internet e tente de novo.',
  // Só acontece nos vídeos; aqui fica igual a uma falha.
  'cota-youtube': 'Não foi possível gerar a análise agora. Verifique a internet e tente de novo.',
}

export type ResultadoAnalise =
  | { ok: true; analise: TextoAnalise; restantes: Restantes }
  | { ok: false; codigo: CodigoErroApi; restantes?: Restantes }

function lerTextoAnalise(dados: unknown): TextoAnalise | null {
  const a = (dados as { analise?: Record<string, unknown> } | null)?.analise
  const lista = (v: unknown) =>
    Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null
  const visaoGeral = lista(a?.visaoGeral)
  const fortes = lista(a?.fortes)
  const evoluiu = lista(a?.evoluiu)
  const atencao = lista(a?.atencao)
  const sugestoes = lista(a?.sugestoes)
  if (!visaoGeral || !fortes || !evoluiu || !atencao || !sugestoes) return null
  return { visaoGeral, fortes, evoluiu, atencao, sugestoes }
}

export async function gerarAnalise(usuario: User, dados: DadosAnalise): Promise<ResultadoAnalise> {
  try {
    const { resposta, dados: corpo } = await chamarApi(usuario, '/api/analise', dados)
    const restantes = lerRestantes(corpo)
    const analise = lerTextoAnalise(corpo)
    if (resposta.ok && analise && restantes) return { ok: true, analise, restantes }
    return { ok: false, codigo: lerCodigoErro(corpo), restantes }
  } catch {
    return { ok: false, codigo: 'falha' }
  }
}

export function consultarRestantesAnalise(usuario: User): Promise<Restantes | null> {
  return consultarRestantesApi(usuario, '/api/analise')
}
