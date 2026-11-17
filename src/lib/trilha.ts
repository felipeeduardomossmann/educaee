import type { AtividadeId } from './atividade'
import type { Sessao } from './sessoes'
import { paresDaMemoria, taxaAcerto } from './sugestao'

// Trilha do dia: aquecimento, 2 focos e final, com as rodadas de antes de hoje.

export type PapelEtapa = 'aquecimento' | 'foco' | 'final'

export interface EtapaTrilha {
  atividadeId: AtividadeId
  papel: PapelEtapa
}

export const ROTULO_PAPEL: Record<PapelEtapa, string> = {
  aquecimento: 'Aquecimento',
  foco: 'Foco',
  final: 'Para fechar',
}

/** Quantos dias de rodadas contam para a trilha. */
const DIAS_RECENTES = 21
/** Rodadas mais recentes de cada atividade usadas no desempenho. */
const RODADAS_DESEMPENHO = 5
const DIA_MS = 24 * 60 * 60 * 1000

/** Dia local do aparelho, como "2026-11-02". */
export function diaLocal(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
}

/** Desempenho de uma rodada (0 a 1); na memória, pelos erros em relação aos pares. */
export function desempenho(sessao: Pick<Sessao, 'atividadeId' | 'nivel' | 'acertos' | 'erros'>) {
  const pares = paresDaMemoria(sessao.atividadeId, sessao.nivel)
  if (pares !== null) return Math.max(0, 1 - sessao.erros / (3 * pares))
  return taxaAcerto(sessao)
}

interface Estatistica {
  atividadeId: AtividadeId
  rodadas: number
  /** Média das últimas rodadas, ou null se nunca jogou (no período). */
  media: number | null
}

/** Número de 0 a 1 que muda a cada dia (desempate estável e variado). */
function sorteioDoDia(dia: string, atividadeId: string): number {
  let h = 2166136261
  for (const c of `${dia}:${atividadeId}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0) / 4294967296
}

/** Monta a trilha do dia (as rodadas de hoje são ignoradas). */
export function montarTrilha(
  disponiveis: readonly AtividadeId[],
  sessoes: readonly Sessao[],
  hoje: Date,
): EtapaTrilha[] {
  const dia = diaLocal(hoje)
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()
  const recentes = sessoes.filter((s) => {
    const t = s.concluidaEm.getTime()
    return t < inicioHoje && t >= inicioHoje - DIAS_RECENTES * DIA_MS
  })
  const sorteio = (id: AtividadeId) => sorteioDoDia(dia, id)
  const ordenar = (lista: Estatistica[], chave: (e: Estatistica) => number) =>
    [...lista].sort(
      (a, b) => chave(a) - chave(b) || sorteio(a.atividadeId) - sorteio(b.atividadeId),
    )

  const estatisticas: Estatistica[] = disponiveis.map((atividadeId) => {
    const daAtividade = recentes
      .filter((s) => s.atividadeId === atividadeId)
      .sort((a, b) => b.concluidaEm.getTime() - a.concluidaEm.getTime())
    const ultimas = daAtividade.slice(0, RODADAS_DESEMPENHO)
    const media =
      ultimas.length === 0 ? null : ultimas.reduce((t, s) => t + desempenho(s), 0) / ultimas.length
    return { atividadeId, rodadas: daAtividade.length, media }
  })

  const escolhidas: AtividadeId[] = []
  const restantes = () => estatisticas.filter((e) => !escolhidas.includes(e.atividadeId))
  const escolher = (lista: Estatistica[]) => {
    const primeira = lista.find((e) => !escolhidas.includes(e.atividadeId)) ?? restantes()[0]
    if (primeira) escolhidas.push(primeira.atividadeId)
  }

  const praticadas = estatisticas.filter((e) => e.media !== null)
  if (praticadas.length < 2) {
    // Sem histórico: uma trilha equilibrada, que varia a cada dia.
    for (const e of ordenar(estatisticas, () => 0).slice(0, 4)) escolhidas.push(e.atividadeId)
  } else {
    // Aquecimento: melhor desempenho (com pelo menos 2 rodadas, se houver).
    const confiaveis = praticadas.filter((e) => e.rodadas >= 2)
    escolher(ordenar(confiaveis.length > 0 ? confiaveis : praticadas, (e) => -(e.media ?? 0)))
    // Foco 1: pior desempenho recente. Foco 2: a menos praticada (inclusive nunca jogada).
    escolher(ordenar(praticadas, (e) => e.media ?? 1))
    escolher(ordenar(estatisticas, (e) => e.rodadas))
    // Final: a mais jogada (gosta), desempatando pelo melhor desempenho.
    escolher(ordenar(estatisticas, (e) => -(e.rodadas + (e.media ?? 0) / 10)))
  }

  const papeis: PapelEtapa[] = ['aquecimento', 'foco', 'foco', 'final']
  return escolhidas.slice(0, 4).map((atividadeId, i) => ({ atividadeId, papel: papeis[i] }))
}

// ---------- Progresso no aparelho ----------

const chave = (alunoId: string, dia: string) => `educaee:trilha:${alunoId}:${dia}`

/** Quantas etapas da trilha de hoje já foram feitas neste aparelho. */
export function etapasFeitas(alunoId: string, hoje = new Date()): number {
  try {
    const valor = Number(localStorage.getItem(chave(alunoId, diaLocal(hoje))))
    return Number.isInteger(valor) && valor > 0 ? valor : 0
  } catch {
    return 0
  }
}

/** Marca a etapa `indice` como feita (só avança; repetir uma etapa não volta a contagem). */
export function marcarEtapa(alunoId: string, indice: number, hoje = new Date()): void {
  try {
    const dia = diaLocal(hoje)
    if (indice + 1 > etapasFeitas(alunoId, hoje)) {
      localStorage.setItem(chave(alunoId, dia), String(indice + 1))
    }
    // Limpa dias antigos deste aluno.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(`educaee:trilha:${alunoId}:`) && k !== chave(alunoId, dia)) {
        localStorage.removeItem(k)
      }
    }
  } catch {
    // Sem armazenamento (ex.: janela anônima restrita): a trilha só não guarda o progresso.
  }
}

/** Falas da trilha (para o catálogo de áudios gravados). */
export const FALA_TRILHA_COMPLETA = 'Trilha completa! Você foi até o fim do caminho.'
export const FALA_TRILHA_INICIO = 'Vamos começar a trilha de hoje?'

export function falas(): string[] {
  return [FALA_TRILHA_COMPLETA, FALA_TRILHA_INICIO]
}
