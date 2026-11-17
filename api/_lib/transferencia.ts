// Lógica pura da transferência de aluno por código (testada em transferencia.test.ts).

/** Sem 0/O e 1/I/L, para não confundir ao ditar ou digitar. */
export const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const TAMANHO_CODIGO = 6
export const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000
/** Tentativas de prévia/recebimento por usuário (contra adivinhar códigos). */
export const TENTATIVAS_POR_HORA = 10
export const TENTATIVAS_POR_DIA = 30
export const TENTATIVAS_POR_MES = 300
/** Códigos ativos por usuário (evita gerar sem fim). */
export const CODIGOS_ATIVOS_MAXIMO = 10

export function gerarCodigo(aleatorioInt: (max: number) => number): string {
  let codigo = ''
  for (let i = 0; i < TAMANHO_CODIGO; i++) {
    codigo += ALFABETO_CODIGO[aleatorioInt(ALFABETO_CODIGO.length)]
  }
  return codigo
}

/** "abc-23 4" → "ABC234"; null se não for um código possível. */
export function normalizarCodigo(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  const codigo = bruto.toUpperCase().replace(/[\s-]/g, '')
  if (codigo.length !== TAMANHO_CODIGO) return null
  return [...codigo].every((c) => ALFABETO_CODIGO.includes(c)) ? codigo : null
}

export interface DadosCodigo {
  origemUid: string
  alunoId: string
  remover: boolean
  expiraEm: number
  usado: boolean
}

export type MotivoInvalido = 'codigo-invalido' | 'proprio-aluno'

/** Por que este código não pode ser usado por `uid` agora (ou null se pode). */
export function motivoInvalido(
  dados: DadosCodigo | null,
  uid: string,
  agora: number,
): MotivoInvalido | null {
  if (!dados || dados.usado || dados.expiraEm <= agora) return 'codigo-invalido'
  if (dados.origemUid === uid) return 'proprio-aluno'
  return null
}

/** Janela do limite de tentativas: a hora atual (UTC), como "2026-11-02T14". */
export function chaveHora(data: Date): string {
  return data.toISOString().slice(0, 13)
}

export interface JanelasTentativa {
  hora: string
  dia: string
  mes: string
}

export interface ContagemTentativas {
  hora: string
  quantidade: number
  dia: string
  noDia: number
  mes: string
  noMes: number
}

export type MotivoTentativas =
  'limite-tentativas' | 'limite-tentativas-dia' | 'limite-tentativas-mes'

/** Soma uma tentativa nas janelas de hora, dia e mês, ou diz qual limite já foi atingido. */
export function contarTentativa(
  dados: Partial<Record<keyof ContagemTentativas, unknown>> | undefined,
  { hora, dia, mes }: JanelasTentativa,
): { ok: true; contagem: ContagemTentativas } | { ok: false; motivo: MotivoTentativas } {
  const atual = (janela: unknown, valor: string, quantidade: unknown) =>
    janela === valor && typeof quantidade === 'number' ? quantidade : 0
  const naHora = atual(dados?.hora, hora, dados?.quantidade)
  const noDia = atual(dados?.dia, dia, dados?.noDia)
  const noMes = atual(dados?.mes, mes, dados?.noMes)
  if (noMes >= TENTATIVAS_POR_MES) return { ok: false, motivo: 'limite-tentativas-mes' }
  if (noDia >= TENTATIVAS_POR_DIA) return { ok: false, motivo: 'limite-tentativas-dia' }
  if (naHora >= TENTATIVAS_POR_HORA) return { ok: false, motivo: 'limite-tentativas' }
  return {
    ok: true,
    contagem: { hora, quantidade: naHora + 1, dia, noDia: noDia + 1, mes, noMes: noMes + 1 },
  }
}

export function primeiroNome(nome: unknown): string {
  const primeiro = typeof nome === 'string' ? nome.trim().split(/\s+/)[0] : ''
  return primeiro ? primeiro.slice(0, 40) : 'uma professora'
}

/** Troca os ids dos cartões próprios na prancha ("c:velho" → "c:novo"); os padrão ficam. */
export function remapearPrancha(prancha: unknown, mapa: ReadonlyMap<string, string>): unknown {
  if (!prancha || typeof prancha !== 'object') return prancha
  const { cartoes, porTela } = prancha as { cartoes?: unknown; porTela?: unknown }
  if (!Array.isArray(cartoes)) return prancha
  return {
    cartoes: cartoes
      .filter((id): id is string => typeof id === 'string')
      .flatMap((id) => {
        if (!id.startsWith('c:')) return [id]
        // Cartão próprio que não foi copiado (ex.: excluído) sai da prancha.
        const novo = mapa.get(id.slice(2))
        return novo ? [`c:${novo}`] : []
      }),
    porTela,
  }
}

/** Ids dos cartões próprios usados numa prancha. */
export function cartoesProprios(prancha: unknown): string[] {
  const cartoes = (prancha as { cartoes?: unknown } | null)?.cartoes
  if (!Array.isArray(cartoes)) return []
  return cartoes
    .filter((id): id is string => typeof id === 'string' && id.startsWith('c:'))
    .map((id) => id.slice(2))
}

/** Divide em lotes (o Firestore aceita até 500 operações por lote). */
export function emLotes<T>(itens: readonly T[], tamanho = 450): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho))
  return lotes
}
