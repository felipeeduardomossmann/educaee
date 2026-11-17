// Lógica pura da análise com IA. A IA recebe só números e escreve "o aluno".

import { FILTROS_SEGURANCA } from './gemini.js'
import {
  AREAS,
  diasEntre,
  indicadoresAtividade,
  POUCA_PRATICA,
  rodadasPorSemana,
  type Area,
  type IndicadoresAtividade,
} from './indicadores.js'

export const MODELO_ANALISE = 'gemini-3.6-flash'

/** As 16 atividades: nome, área (as habilidades da tela de escolha) e o que cada uma treina. */
const ATIVIDADES = {
  memoria: {
    nome: 'Jogo da memória',
    area: 'Memória',
    treina: 'memória (achar os pares de cartas)',
  },
  pares: { nome: 'Pares que combinam', area: 'Memória', treina: 'memória e associação de ideias' },
  faltando: { nome: 'O que está faltando?', area: 'Memória', treina: 'memória visual' },
  igual: { nome: 'Encontre o igual', area: 'Atenção', treina: 'atenção e discriminação visual' },
  pegue: { nome: 'Pegue só o...', area: 'Atenção', treina: 'atenção e controle do impulso' },
  sombra: { nome: 'Qual é a sombra?', area: 'Atenção', treina: 'percepção visual de formas' },
  alvo: { nome: 'Toque no alvo', area: 'Coordenação motora', treina: 'coordenação olho-mão' },
  caminhos: { nome: 'Caminhos', area: 'Coordenação motora', treina: 'traçado e pré-escrita' },
  segure: { nome: 'Toque e segure', area: 'Coordenação motora', treina: 'controle do toque' },
  letras: { nome: 'Letras e sílabas', area: 'Alfabetização', treina: 'letras e sílabas' },
  sons: {
    nome: 'Sons das palavras',
    area: 'Alfabetização',
    treina: 'consciência dos sons e rimas',
  },
  monte: { nome: 'Monte a palavra', area: 'Alfabetização', treina: 'juntar sílabas em palavras' },
  sequencia: { nome: 'Complete a sequência', area: 'Lógica', treina: 'padrões e sequências' },
  rotina: { nome: 'Rotina do dia', area: 'Lógica', treina: 'ordem dos acontecimentos' },
  emocoes: { nome: 'Emoções', area: 'Emoções', treina: 'reconhecer emoções' },
  contar: { nome: 'Contar', area: 'Matemática', treina: 'contagem e quantidade' },
} as const satisfies Record<string, { nome: string; area: Area; treina: string }>

type IdAtividade = keyof typeof ATIVIDADES
const PERIODOS = ['7', '30', 'tudo'] as const
export type PeriodoAnalise = (typeof PERIODOS)[number]

const ROTULO_PERIODO: Record<PeriodoAnalise, string> = {
  '7': 'os últimos 7 dias',
  '30': 'os últimos 30 dias',
  tudo: 'todo o histórico',
}

/** Máximo de rodadas por atividade enviadas à IA (as mais recentes). */
export const MAXIMO_RODADAS = 60

export interface RodadaAnalise {
  /** "AAAA-MM-DD" */
  data: string
  nivel: number
  /** Taxa de acerto em % (0 a 100). */
  taxa: number
}

export interface AtividadeAnalise {
  atividade: IdAtividade
  nivelAtual: number
  /** Total de rodadas no período (pode ser maior que a lista, que é cortada). */
  totalRodadas: number
  /** Em ordem cronológica. */
  rodadas: RodadaAnalise[]
}

export interface DadosAnalise {
  periodo: PeriodoAnalise
  atividades: AtividadeAnalise[]
}

const ehInteiro = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const ehData = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Copia só os campos esperados (descarta qualquer outro, como um nome); null se inválido. */
export function validarDados(bruto: unknown): DadosAnalise | null {
  if (!bruto || typeof bruto !== 'object') return null
  const { periodo, atividades } = bruto as { periodo?: unknown; atividades?: unknown }
  if (!PERIODOS.includes(periodo as PeriodoAnalise)) return null
  if (!Array.isArray(atividades) || atividades.length > Object.keys(ATIVIDADES).length) return null
  const vistas = new Set<string>()
  const limpas: AtividadeAnalise[] = []
  for (const item of atividades as Record<string, unknown>[]) {
    if (!item || typeof item !== 'object') return null
    const { atividade, nivelAtual, totalRodadas, rodadas } = item
    if (typeof atividade !== 'string' || !(atividade in ATIVIDADES) || vistas.has(atividade)) {
      return null
    }
    vistas.add(atividade)
    if (!ehInteiro(nivelAtual, 1, 4) || !ehInteiro(totalRodadas, 0, 100_000)) return null
    if (!Array.isArray(rodadas) || rodadas.length > MAXIMO_RODADAS) return null
    if (rodadas.length > totalRodadas) return null
    const rodadasLimpas: RodadaAnalise[] = []
    for (const r of rodadas as Record<string, unknown>[]) {
      if (!r || !ehData(r.data) || !ehInteiro(r.nivel, 1, 4) || !ehInteiro(r.taxa, 0, 100)) {
        return null
      }
      rodadasLimpas.push({ data: r.data, nivel: r.nivel, taxa: r.taxa })
    }
    limpas.push({
      atividade: atividade as IdAtividade,
      nivelAtual,
      totalRodadas,
      rodadas: rodadasLimpas,
    })
  }
  return { periodo: periodo as PeriodoAnalise, atividades: limpas }
}

/** "2026-10-03" → "03/10/2026" (como as datas aparecem no texto da análise). */
export function dataBrasileira(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const pct = (valor: number) => `${valor}%`

const TEXTO_CONSISTENCIA: Record<IndicadoresAtividade['consistencia'], string> = {
  regular: 'resultados regulares de uma rodada para outra',
  variavel: 'resultados que variam de uma rodada para outra',
  'muito-variavel': 'resultados que variam muito de uma rodada para outra',
  'poucos-dados': 'poucas rodadas para avaliar a regularidade',
}

/** Começo × fim do período (nível e acertos), base da seção "Evolução". */
export function comecoFim(id: IdAtividade, ind: IndicadoresAtividade): string {
  const nivel =
    ind.nivelFim > ind.nivelInicio
      ? `subiu do nível ${ind.nivelInicio} para o ${ind.nivelFim}`
      : ind.nivelFim < ind.nivelInicio
        ? `voltou do nível ${ind.nivelInicio} para o ${ind.nivelFim}`
        : ''
  if (id === 'caminhos' || ind.tendencia === 'poucos-dados') {
    return nivel || 'sem dados suficientes para comparar o começo e o fim'
  }
  const subiu = ind.nivelFim > ind.nivelInicio
  const acertos =
    ind.tendencia === 'subindo'
      ? 'os acertos melhoraram'
      : ind.tendencia === 'estavel'
        ? subiu
          ? 'os acertos se mantiveram mesmo com o desafio maior'
          : 'os acertos se mantiveram'
        : subiu
          ? 'os acertos caíram um pouco depois de subir de nível (esperado)'
          : 'os acertos caíram'
  return nivel ? `${nivel} e ${acertos}` : acertos
}

/** Uma linha de indicadores de uma atividade, em português simples. */
function linhaAtividade(id: IdAtividade, ind: IndicadoresAtividade): string {
  const info = ATIVIDADES[id]
  const partes = [
    `${info.nome}: ${ind.rodadas} ${ind.rodadas === 1 ? 'rodada' : 'rodadas'} em ${ind.dias} ${
      ind.dias === 1 ? 'dia' : 'dias'
    }, nível atual ${ind.nivelAtual}`,
  ]
  if (ind.subidas > 0 || ind.descidas > 0) {
    const mudancas = [
      ind.subidas > 0 ? `subiu de nível ${ind.subidas}x` : '',
      ind.descidas > 0 ? `desceu de nível ${ind.descidas}x` : '',
    ].filter(Boolean)
    partes.push(
      `${mudancas.join(' e ')} (começou no ${ind.nivelInicio}, terminou no ${ind.nivelFim})`,
    )
  } else {
    partes.push(`jogou sempre no nível ${ind.nivelFim}`)
  }
  if (id === 'caminhos') {
    partes.push('não tem erros: olhar só nível e frequência')
  } else {
    if (ind.tendencia === 'poucos-dados') {
      partes.push(`acerto médio ${pct(ind.mediaTaxa)} (poucas rodadas para ver tendência)`)
    } else if (ind.tendencia === 'estavel') {
      partes.push(`acerto estável, perto de ${pct(ind.mediaTaxa)}`)
    } else {
      partes.push(
        `acerto ${ind.tendencia === 'subindo' ? 'subindo' : 'caindo'}: ${pct(ind.taxaInicio ?? 0)} no início e ${pct(ind.taxaFim ?? 0)} no fim do período`,
      )
    }
    partes.push(TEXTO_CONSISTENCIA[ind.consistencia])
    if (id !== 'memoria' && id !== 'pares') {
      if (ind.sinal === 'pode-subir') {
        partes.push(
          `nível ${ind.nivelFim} parece fácil: acertos altos nas últimas rodadas, pode subir`,
        )
      } else if (ind.sinal === 'desafiador') {
        partes.push(
          ind.nivelFim > 1
            ? `nível ${ind.nivelFim} está desafiador: vale voltar um nível ou jogar com mais apoio`
            : 'nível 1 ainda está desafiador: vale jogar com mais apoio e mediação',
        )
      }
    }
    if (ind.subidas + ind.descidas > 0 && ind.rodadasNoNivelFinal > 0) {
      partes.push(
        `no nível ${ind.nivelFim}: ${pct(ind.mediaNoNivelFinal)} em ${ind.rodadasNoNivelFinal} ${
          ind.rodadasNoNivelFinal === 1 ? 'rodada' : 'rodadas'
        }`,
      )
    }
  }
  if (id === 'memoria' || id === 'pares') {
    partes.push(
      'nos jogos de memória errar faz parte de descobrir as cartas, então a taxa é naturalmente mais baixa',
    )
  }
  partes.push(`COMEÇO × FIM: ${comecoFim(id, ind)}`)
  return `- ${partes.join('; ')}.`
}

/** Indicadores do período, agrupados por área, para entrar no prompt (sem a lista de rodadas). */
export function descreverDados(dados: DadosAnalise): string {
  const total = dados.atividades.reduce((soma, a) => soma + a.totalRodadas, 0)
  const todasAsDatas = dados.atividades.flatMap((a) => a.rodadas.map((r) => r.data)).sort()
  const diasComPratica = new Set(todasAsDatas).size
  const diasDoPeriodo =
    dados.periodo === '7'
      ? 7
      : dados.periodo === '30'
        ? 30
        : todasAsDatas.length > 0
          ? diasEntre(todasAsDatas[0], todasAsDatas[todasAsDatas.length - 1])
          : 7

  const linhas = [
    `Período: ${ROTULO_PERIODO[dados.periodo]}.`,
    `Prática: ${total} ${total === 1 ? 'rodada' : 'rodadas'} em ${diasComPratica} ${
      diasComPratica === 1 ? 'dia' : 'dias'
    } diferentes (cerca de ${rodadasPorSemana(total, diasDoPeriodo)} rodadas por semana).`,
  ]
  if (todasAsDatas.length > 0) {
    linhas.push(
      `Primeira rodada em ${dataBrasileira(todasAsDatas[0])}; última em ${dataBrasileira(
        todasAsDatas[todasAsDatas.length - 1],
      )}.`,
    )
  }

  const { porArea, semPratica, poucosDados, comDados } = agruparPorArea(dados)
  for (const area of AREAS) {
    const itens = porArea.get(area)
    if (!itens) continue
    const rodadas = itens.reduce((s, i) => s + i.ind.rodadas, 0)
    const base = poucosDados.includes(area)
      ? 'POUCOS DADOS: ainda é cedo para concluir'
      : 'dados suficientes'
    linhas.push('', `### ${area}: ${rodadas} ${rodadas === 1 ? 'rodada' : 'rodadas'} (${base})`)
    for (const { id, ind } of itens) linhas.push(linhaAtividade(id, ind))
  }

  linhas.push('')
  linhas.push(
    comDados.length > 0
      ? `Áreas com dados suficientes (as únicas que podem ser pontos fortes ou de atenção): ${comDados.join(', ')}.`
      : 'Nenhuma área tem dados suficientes para concluir.',
  )
  if (poucosDados.length > 0) {
    linhas.push(
      `Áreas com poucos dados (menos de ${POUCA_PRATICA} rodadas; nunca pontos fortes nem de atenção, só "ainda é cedo"): ${poucosDados.join(', ')}.`,
    )
  }
  linhas.push(
    semPratica.length > 0
      ? `Áreas sem nenhuma rodada no período: ${semPratica.join(', ')}.`
      : 'Todas as áreas tiveram pelo menos uma rodada no período.',
  )
  return linhas.join('\n')
}

type ItemArea = { id: IdAtividade; ind: IndicadoresAtividade }

/** Indicadores por área e a separação entre áreas com dados suficientes, poucos dados e sem prática. */
export function agruparPorArea(dados: DadosAnalise) {
  const porArea = new Map<Area, ItemArea[]>()
  for (const a of dados.atividades) {
    const ind = indicadoresAtividade(a.rodadas, a.nivelAtual, a.totalRodadas)
    if (!ind) continue
    const area = ATIVIDADES[a.atividade].area
    porArea.set(area, [...(porArea.get(area) ?? []), { id: a.atividade, ind }])
  }
  const semPratica: Area[] = []
  const poucosDados: Area[] = []
  const comDados: Area[] = []
  for (const area of AREAS) {
    const itens = porArea.get(area)
    if (!itens) semPratica.push(area)
    else if (itens.reduce((s, i) => s + i.ind.rodadas, 0) < POUCA_PRATICA) poucosDados.push(area)
    else comDados.push(area)
  }
  return { porArea, semPratica, poucosDados, comDados }
}

const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Tira dos pontos fortes o que cita uma área com poucos dados. */
export function removerContradicoes(analise: Analise, dados: DadosAnalise): Analise {
  const { poucosDados } = agruparPorArea(dados)
  const nomes = Object.values(ATIVIDADES)
    .filter((a) => (poucosDados as string[]).includes(a.area))
    .map((a) => a.nome)
  const termos = [...poucosDados, ...nomes].map(semAcento)
  const citaPouco = (item: string) => termos.some((t) => semAcento(item).includes(t))
  return { ...analise, fortes: analise.fortes.filter((item) => !citaPouco(item)) }
}

/** Catálogo das atividades do EducAEE, para as sugestões citarem nomes reais. */
function catalogo(): string {
  return AREAS.map((area) => {
    const nomes = Object.values(ATIVIDADES)
      .filter((a) => a.area === area)
      .map((a) => `${a.nome} (${a.treina})`)
    return `- ${area}: ${nomes.join('; ')}`
  }).join('\n')
}

/** Prompt fixo. Os indicadores entram no fim, já em texto. */
export function montarPrompt(dados: DadosAnalise): string {
  return `Você é uma professora experiente do Atendimento Educacional Especializado (AEE). Escreva uma análise pedagógica do progresso de um aluno nas atividades do EducAEE, para professoras e famílias.

O objetivo é INTERPRETAR, não listar: diga o que os resultados mostram sobre o aluno e o que fazer a seguir. Os indicadores abaixo já foram calculados; não repita as linhas deles.

Regras:
- Português do Brasil, linguagem simples e acolhedora, frases curtas. Sem jargão.
- Refira-se ao aluno sempre como "o aluno". Não use pronomes (ele, ela) nem palavras com gênero para falar dele (diga "mostrou atenção", não "está atento").
- Use no máximo 2 números (porcentagens ou quantidades) na análise INTEIRA, só como evidência do que for mais importante. No resto, use palavras: "quase sempre", "cerca de metade", "com frequência".
- Não elogie nem critique o que os indicadores não mostram (por exemplo: curiosidade, dedicação, esforço, humor).
- Não faça diagnóstico, não use termos clínicos ou médicos e não compare com outras crianças.
- Não invente: fale só do que os indicadores mostram. Se uma área tem poucas rodadas, diga com gentileza que ainda é cedo para concluir.
- Interprete com cuidado:
  - acerto um pouco menor logo depois de subir de nível é esperado: o desafio aumentou;
  - quando o indicador diz que o nível parece fácil, sugira subir; quando diz que está desafiador, sugira voltar um nível ou dar mais apoio;
  - resultados que variam muito pedem observar o momento (cansaço, atenção, ambiente) antes de mudar o nível;
  - nos jogos de memória, errar faz parte do jogo.
- Pontos de atenção são oportunidades, nunca falhas. Se não houver nenhum, deixe a lista vazia.
- Coerência (obrigatório):
  - só as áreas com "dados suficientes" podem aparecer em pontos fortes ou em pontos de atenção;
  - uma área com POUCOS DADOS nunca é ponto forte; sobre ela só se pode dizer que ainda é cedo (no máximo 1 item em pontos de atenção, juntando todas essas áreas);
  - uma área citada como ponto forte nunca aparece como "ainda é cedo" ou "poucas rodadas".
- Evolução: compare o COMEÇO com o FIM do período usando as linhas "COMEÇO × FIM" (melhorou, manteve, caiu, mudou de nível). Fale só das áreas com dados suficientes. NUNCA fale de frequência, de dias, de rotina ou de quantidade de rodadas nessa seção. Se nenhuma área tem dados para comparar, escreva um único item: "Ainda não há rodadas suficientes para comparar o começo e o fim do período."
- Sugestões práticas para os próximos atendimentos: cite pelo nome as atividades do EducAEE (lista abaixo) e o nível quando fizer sentido. Inclua uma área pouco praticada ou sem prática, se houver.

Formato (JSON):
- "visaoGeral": 2 ou 3 frases sobre como o aluno está no período.
- "pontosFortes": 1 a 3 itens curtos.
- "pontosAtencao": 0 a 3 itens curtos.
- "evolucao": 1 a 3 itens curtos comparando o começo e o fim do período.
- "sugestoes": 2 ou 3 itens curtos e práticos.
Cada item com no máximo 30 palavras.

Atividades do EducAEE (por área):
${catalogo()}

Indicadores do aluno:
${descreverDados(dados)}`
}

const LISTA = { type: 'array', items: { type: 'string' } } as const
const ESQUEMA = {
  type: 'object',
  properties: {
    visaoGeral: { type: 'string' },
    pontosFortes: LISTA,
    pontosAtencao: LISTA,
    evolucao: LISTA,
    sugestoes: LISTA,
  },
  required: ['visaoGeral', 'pontosFortes', 'pontosAtencao', 'evolucao', 'sugestoes'],
} as const

export function corpoPedidoAnalise(dados: DadosAnalise, modelo = MODELO_ANALISE) {
  return {
    model: modelo,
    store: false,
    input: [{ type: 'text', text: montarPrompt(dados) }],
    response_format: { type: 'text', mime_type: 'application/json', schema: ESQUEMA },
    generation_config: { thinking_level: 'low', temperature: 0.4 },
    safety_settings: FILTROS_SEGURANCA,
  }
}

/** O que o navegador recebe (e salva no aluno). "evoluiu" é a "Evolução no período". */
export interface Analise {
  visaoGeral: string[]
  fortes: string[]
  atencao: string[]
  evoluiu: string[]
  sugestoes: string[]
}

/** Texto de resposta da IA (passo "model_output"). */
export function extrairTexto(resposta: unknown): string | null {
  const passos = (resposta as { steps?: unknown } | null)?.steps
  if (!Array.isArray(passos)) return null
  for (const passo of passos as { type?: unknown; content?: unknown }[]) {
    if (passo?.type !== 'model_output' || !Array.isArray(passo.content)) continue
    const textos = (passo.content as { type?: unknown; text?: unknown }[])
      .filter((p) => p?.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
    if (textos.length > 0) return textos.join('')
  }
  return null
}

const TAMANHO_MAXIMO_ITEM = 700

function listaDeTextos(valor: unknown, maximo: number): string[] | null {
  if (typeof valor === 'string') valor = [valor]
  if (!Array.isArray(valor)) return null
  return valor
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.replace(/\s+/g, ' ').trim())
    .filter((v) => v.length > 0)
    .slice(0, maximo)
    .map((v) => (v.length > TAMANHO_MAXIMO_ITEM ? `${v.slice(0, TAMANHO_MAXIMO_ITEM - 1)}…` : v))
}

/** Lê e arruma o JSON da IA. null se não vier no formato (conta como falha). */
export function lerAnalise(texto: string | null): Analise | null {
  if (!texto) return null
  let json: unknown
  try {
    json = JSON.parse(texto)
  } catch {
    return null
  }
  const j = json as Record<string, unknown>
  const visaoGeral = listaDeTextos(j?.visaoGeral, 1)
  const fortes = listaDeTextos(j?.pontosFortes, 3)
  const atencao = listaDeTextos(j?.pontosAtencao, 3)
  const evoluiu = listaDeTextos(j?.evolucao, 3)
  const sugestoes = listaDeTextos(j?.sugestoes, 3)
  if (!visaoGeral || !fortes || !atencao || !evoluiu || !sugestoes) return null
  if (visaoGeral.length === 0 || sugestoes.length === 0) return null
  return { visaoGeral, fortes, atencao, evoluiu, sugestoes }
}
