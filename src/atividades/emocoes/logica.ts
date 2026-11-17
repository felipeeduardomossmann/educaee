import { embaralhar, sortear, type Aleatorio } from '../../lib/aleatorio'
import type { NomeFigura } from '../../lib/figuras'

export type EmocaoId = 'feliz' | 'triste' | 'bravo' | 'medo' | 'surpreso'

export const EMOCOES: Record<EmocaoId, { figura: NomeFigura; nome: string }> = {
  feliz: { figura: 'rosto-feliz', nome: 'feliz' },
  triste: { figura: 'rosto-triste', nome: 'triste' },
  bravo: { figura: 'rosto-bravo', nome: 'bravo' },
  medo: { figura: 'rosto-com-medo', nome: 'com medo' },
  surpreso: { figura: 'rosto-surpreso', nome: 'surpreso' },
}
const IDS = Object.keys(EMOCOES) as EmocaoId[]

/** Nível 4: situações do dia a dia (sem nomes de pessoas), 3 por emoção. */
export const SITUACOES: readonly { texto: string; emocao: EmocaoId }[] = [
  { texto: 'Ganhou um presente de aniversário.', emocao: 'feliz' },
  { texto: 'Brincou no parque com os amigos.', emocao: 'feliz' },
  { texto: 'Recebeu um abraço da vovó.', emocao: 'feliz' },
  { texto: 'O sorvete caiu no chão.', emocao: 'triste' },
  { texto: 'O balão voou para longe.', emocao: 'triste' },
  { texto: 'O amigo foi embora e a brincadeira acabou.', emocao: 'triste' },
  { texto: 'Pegaram o brinquedo sem pedir.', emocao: 'bravo' },
  { texto: 'Derrubaram a torre de blocos de propósito.', emocao: 'bravo' },
  { texto: 'Furaram a fila na frente.', emocao: 'bravo' },
  { texto: 'Ouviu um trovão bem forte à noite.', emocao: 'medo' },
  { texto: 'Um cachorro grande latiu bem perto.', emocao: 'medo' },
  { texto: 'A luz apagou e ficou tudo escuro.', emocao: 'medo' },
  { texto: 'Abriu a caixa e saiu um boneco de mola.', emocao: 'surpreso' },
  { texto: 'Apareceu um arco-íris no céu.', emocao: 'surpreso' },
  { texto: 'A festa surpresa começou de repente.', emocao: 'surpreso' },
]

/** Nível 1 = 2 rostos · 2 = 3 · 3 = 4 · 4 = situação narrada, com 3 rostos. */
export const OPCOES_POR_NIVEL: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 3 }

export interface DesafioEmocoes {
  alvo: EmocaoId
  opcoes: EmocaoId[]
  /** Só no nível 4. */
  situacao: string | null
}

export function criarDesafio(
  nivel: number,
  anterior: DesafioEmocoes | null,
  aleatorio?: Aleatorio,
): DesafioEmocoes {
  const quantidade = OPCOES_POR_NIVEL[nivel] ?? 2
  if (nivel >= 4) {
    const possiveis = SITUACOES.filter((s) => s.texto !== anterior?.situacao)
    const [s] = sortear(possiveis, 1, aleatorio) as [(typeof SITUACOES)[number]]
    const outras = sortear(
      IDS.filter((id) => id !== s.emocao),
      quantidade - 1,
      aleatorio,
    )
    return {
      alvo: s.emocao,
      opcoes: embaralhar([s.emocao, ...outras], aleatorio),
      situacao: s.texto,
    }
  }
  const [alvo] = sortear(
    IDS.filter((id) => id !== anterior?.alvo),
    1,
    aleatorio,
  ) as [EmocaoId]
  const outras = sortear(
    IDS.filter((id) => id !== alvo),
    quantidade - 1,
    aleatorio,
  )
  return { alvo, opcoes: embaralhar([alvo, ...outras], aleatorio), situacao: null }
}

export const PERGUNTA_SITUACAO = 'Como a criança se sente? Toque no rosto.'

export function instrucao(desafio: DesafioEmocoes): { texto: string; fala: string } {
  if (desafio.situacao) {
    return { texto: desafio.situacao, fala: `${desafio.situacao} ${PERGUNTA_SITUACAO}` }
  }
  const texto = `Toque no rosto ${EMOCOES[desafio.alvo].nome}.`
  return { texto, fala: texto }
}

export function falas(): string[] {
  return [
    ...IDS.map((id) => `Toque no rosto ${EMOCOES[id].nome}.`),
    ...SITUACOES.map((s) => `${s.texto} ${PERGUNTA_SITUACAO}`),
  ]
}
