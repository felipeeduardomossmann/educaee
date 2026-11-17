// Limites de uso das funções com IA e os períodos em que são contados (lógica pura).

const FUSO = 'America/Sao_Paulo'

function partesData(data: Date) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  return { ano: valor('year'), mes: valor('month'), dia: valor('day') }
}

/** Dia no horário de Brasília, como "2026-11-02" (vira à meia-noite de Brasília). */
export function chaveDia(data: Date): string {
  const { ano, mes, dia } = partesData(data)
  return `${ano}-${mes}-${dia}`
}

/** Mês no horário de Brasília, como "2026-11" (vira no dia 1, à meia-noite de Brasília). */
export function chaveMes(data: Date): string {
  const { ano, mes } = partesData(data)
  return `${ano}-${mes}`
}

export interface Limites {
  /** Por usuário, por dia. */
  porDia: number
  /** No site todo, por mês (null = sem limite mensal). */
  porMes: number | null
  /** Por usuário, por mês (opcional). */
  porUsuarioMes?: number
}

export const LIMITES_DESENHOS: Limites = { porDia: 10, porMes: 150 }
export const LIMITES_ANALISES: Limites = { porDia: 20, porMes: 1000 }
/** O limite do projeto no YouTube (100 buscas por dia) fica em _lib/youtube.ts. */
export const LIMITES_VIDEOS: Limites = { porDia: 20, porMes: null, porUsuarioMes: 30 * 20 }

export interface Uso {
  /** Quantos o usuário já usou hoje. */
  usadosHoje: number
  /** Quantos foram usados no site todo neste mês. */
  totalMes: number
  /** Quantos o usuário usou neste mês (só conta onde há porUsuarioMes). */
  usadosNoMes?: number
}

export type MotivoLimite = 'limite-dia' | 'limite-mes'

/** O limite do mês vem primeiro: se ele acabou, não adianta falar do limite do dia. */
export function motivoBloqueio(
  { usadosHoje, totalMes, usadosNoMes = 0 }: Uso,
  { porDia, porMes, porUsuarioMes }: Limites,
): MotivoLimite | null {
  if (porMes !== null && totalMes >= porMes) return 'limite-mes'
  if (porUsuarioMes !== undefined && usadosNoMes >= porUsuarioMes) return 'limite-mes'
  if (usadosHoje >= porDia) return 'limite-dia'
  return null
}

export interface Restantes {
  /** Quantos ainda dá para usar hoje (já considerando o limite do mês). */
  restamHoje: number
  /** true quando o que limita é o mês do site, não o dia do usuário. */
  limitadoPeloMes: boolean
}

export function calcularRestantes(
  { usadosHoje, totalMes, usadosNoMes = 0 }: Uso,
  { porDia, porMes, porUsuarioMes }: Limites,
): Restantes {
  const doDia = Math.max(0, porDia - usadosHoje)
  const doMes = Math.min(
    porMes === null ? Infinity : Math.max(0, porMes - totalMes),
    porUsuarioMes === undefined ? Infinity : Math.max(0, porUsuarioMes - usadosNoMes),
  )
  if (doMes === Infinity) return { restamHoje: doDia, limitadoPeloMes: false }
  // Com o mês esgotado, a mensagem é sempre a do mês (como em motivoBloqueio).
  return { restamHoje: Math.min(doDia, doMes), limitadoPeloMes: doMes === 0 || doMes < doDia }
}
