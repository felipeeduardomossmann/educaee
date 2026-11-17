// Relatório de progresso em PDF (A4 retrato), gerado no navegador com jsPDF + jspdf-autotable.
// Este módulo (e a fonte) só é carregado quando a professora clica em "Baixar relatório (PDF)".

import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import urlNegrito from '../assets/fontes/Nunito-ExtraBold.ttf?url'
import urlNormal from '../assets/fontes/Nunito-Regular.ttf?url'
import { ATIVIDADES, buscarAtividade } from '../atividades/registro'
import type { Aluno } from './aluno'
import { AVISO_ANALISE, SECOES_ANALISE, type TextoAnalise } from './analise'
import { formatarDuracao } from './cronometro'
import {
  formatarData,
  formatarDataHora,
  formatarPorcentagem,
  resumir,
  serieGrafico,
} from './progresso'
import type { Sessao } from './sessoes'
import { taxaAcerto } from './sugestao'

export interface DadosRelatorio {
  aluno: Aluno
  /** Ex.: "Últimos 30 dias". */
  rotuloPeriodo: string
  /** Rodadas do período, da mais nova para a mais antiga. */
  sessoes: readonly Sessao[]
  /** Análise do mesmo período, já com o nome do aluno (ou null). */
  analise: TextoAnalise | null
  emitidoEm?: Date
}

// Cores do site (src/index.css)
type Rgb = [number, number, number]
const COR = {
  tinta: [0x1f, 0x2d, 0x3d],
  tintaSuave: [0x4a, 0x58, 0x68],
  coral: [0xc8, 0x41, 0x0b],
  azul: [0x2b, 0x6c, 0xb0],
  borda: [0xe8, 0xdf, 0xd2],
  creme: [0xff, 0xfa, 0xf2],
  ceu: [0xdc, 0xeb, 0xfb],
  menta: [0xd5, 0xf3, 0xe4],
  sol: [0xff, 0xf0, 0xbf],
  lilas: [0xe9, 0xe1, 0xfb],
  branco: [0xff, 0xff, 0xff],
} satisfies Record<string, Rgb>

const LARGURA = 210
const ALTURA = 297
const MARGEM = 16
const UTIL = LARGURA - 2 * MARGEM
const FIM_CONTEUDO = ALTURA - 18 // espaço do rodapé
export const FONTE = 'Nunito'

/** Tira emojis e símbolos que a fonte não tem (ficariam como quadradinhos). */
function limpar(texto: string): string {
  return texto.replace(/[^\p{L}\p{N}\p{P}\p{Zs}+=<>%°ºª$]/gu, '').trim()
}

async function base64DaUrl(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer())
  let binario = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binario)
}

export async function prepararFontes(doc: jsPDF) {
  const [normal, negrito] = await Promise.all([base64DaUrl(urlNormal), base64DaUrl(urlNegrito)])
  doc.addFileToVFS('Nunito-Regular.ttf', normal)
  doc.addFont('Nunito-Regular.ttf', FONTE, 'normal')
  doc.addFileToVFS('Nunito-ExtraBold.ttf', negrito)
  doc.addFont('Nunito-ExtraBold.ttf', FONTE, 'bold')
}

/** "EducAEE_Relatorio_Ana_Clara_2026-11-02.pdf" */
export function nomeArquivoRelatorio(nome: string, data: Date): string {
  const nomeLimpo =
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Aluno'
  const dois = (n: number) => String(n).padStart(2, '0')
  const dia = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
  return `EducAEE_Relatorio_${nomeLimpo}_${dia}.pdf`
}

class Pagina {
  y = MARGEM
  readonly doc: jsPDF
  constructor(doc: jsPDF) {
    this.doc = doc
  }

  /** Garante espaço; se não couber, começa outra página. */
  garantir(altura: number) {
    if (this.y + altura > FIM_CONTEUDO) {
      this.doc.addPage()
      this.y = MARGEM
    }
  }

  fonte(tamanho: number, peso: 'normal' | 'bold' = 'normal', cor: Rgb = COR.tinta) {
    this.doc.setFont(FONTE, peso)
    this.doc.setFontSize(tamanho)
    this.doc.setTextColor(...cor)
  }

  /** Altura de uma linha de texto em mm. */
  linha(tamanho: number) {
    return tamanho * 0.3528 * 1.35
  }

  /** Título de seção; `seguinte` é a altura do primeiro bloco (para não ficar sozinho). */
  titulo(texto: string, seguinte = 12) {
    this.garantir(13 + seguinte)
    this.y += 4
    this.fonte(14, 'bold')
    this.doc.text(texto, MARGEM, this.y + 4)
    this.y += 9
  }

  /** Parágrafo com quebra de linha automática (e quebra de página entre linhas). */
  paragrafo(texto: string, opcoes: { tamanho?: number; cor?: Rgb; recuo?: number } = {}) {
    const { tamanho = 10.5, cor = COR.tinta, recuo = 0 } = opcoes
    this.fonte(tamanho, 'normal', cor)
    const linhas = this.doc.splitTextToSize(limpar(texto), UTIL - recuo) as string[]
    const altura = this.linha(tamanho)
    for (const linha of linhas) {
      this.garantir(altura)
      this.doc.text(linha, MARGEM + recuo, this.y + altura * 0.75)
      this.y += altura
    }
  }

  itens(subtitulo: string, itens: readonly string[]) {
    if (itens.length === 0) return
    this.garantir(14)
    this.y += 2
    this.fonte(11, 'bold')
    this.doc.text(subtitulo, MARGEM, this.y + 4)
    this.y += 6.5
    for (const item of itens) {
      const altura = this.linha(10.5)
      this.garantir(altura)
      this.fonte(10.5, 'bold', COR.coral)
      this.doc.text('•', MARGEM + 1.5, this.y + altura * 0.75)
      this.paragrafo(item, { recuo: 6 })
      this.y += 1
    }
  }
}

function cabecalho(p: Pagina, dados: DadosRelatorio, emitidoEm: Date) {
  const { doc } = p
  // Logo: "Educ" em tinta e "AEE" em coral.
  p.fonte(22, 'bold')
  doc.text('Educ', MARGEM, MARGEM + 7)
  const larguraEduc = doc.getTextWidth('Educ')
  doc.setTextColor(...COR.coral)
  doc.text('AEE', MARGEM + larguraEduc, MARGEM + 7)
  p.fonte(11, 'normal', COR.tintaSuave)
  doc.text('Relatório de progresso', LARGURA - MARGEM, MARGEM + 6.5, { align: 'right' })
  doc.setDrawColor(...COR.coral)
  doc.setLineWidth(0.8)
  doc.line(MARGEM, MARGEM + 11, LARGURA - MARGEM, MARGEM + 11)
  p.y = MARGEM + 20

  p.fonte(20, 'bold')
  doc.text(limpar(dados.aluno.nome), MARGEM, p.y + 5)
  p.y += 10
  p.fonte(10.5, 'normal', COR.tintaSuave)
  const detalhes = [
    `Turma: ${dados.aluno.turma ? limpar(dados.aluno.turma) : 'sem turma'}`,
    `Período: ${dados.rotuloPeriodo}`,
    `Emitido em ${formatarData(emitidoEm)}`,
  ]
  doc.text(detalhes.join('   ·   '), MARGEM, p.y + 3)
  p.y += 9
}

function cartao(p: Pagina, x: number, largura: number, altura: number, fundo: Rgb) {
  p.doc.setFillColor(...fundo)
  p.doc.setDrawColor(...COR.borda)
  p.doc.setLineWidth(0.3)
  p.doc.roundedRect(x, p.y, largura, altura, 3, 3, 'FD')
}

function resumo(p: Pagina, dados: DadosRelatorio) {
  const { doc } = p
  const jogadas = ATIVIDADES.filter((a) => dados.sessoes.some((s) => s.atividadeId === a.id))
  p.titulo('Resumo', 70)

  // Dois cartões grandes
  const meio = (UTIL - 4) / 2
  p.garantir(22)
  for (const [i, [rotulo, valor, fundo]] of (
    [
      ['Rodadas no período', String(dados.sessoes.length), COR.ceu],
      ['Atividades jogadas', `${jogadas.length} de ${ATIVIDADES.length}`, COR.menta],
    ] as const
  ).entries()) {
    const x = MARGEM + i * (meio + 4)
    cartao(p, x, meio, 19, fundo)
    p.fonte(20, 'bold')
    doc.text(valor, x + 5, p.y + 10)
    p.fonte(9.5, 'normal', COR.tintaSuave)
    doc.text(rotulo, x + 5, p.y + 15.5)
  }
  p.y += 23

  // Nível atual em cada atividade
  p.garantir(24)
  p.fonte(10, 'bold', COR.tintaSuave)
  doc.text('Nível atual em cada atividade (de 1 a 4)', MARGEM, p.y + 3)
  p.y += 5.5
  // Até 6 cartões por linha (são 16 atividades).
  const porLinha = Math.min(6, ATIVIDADES.length)
  const larguraNivel = (UTIL - (porLinha - 1) * 3) / porLinha
  for (let inicio = 0; inicio < ATIVIDADES.length; inicio += porLinha) {
    p.garantir(20)
    ATIVIDADES.slice(inicio, inicio + porLinha).forEach((atividade, i) => {
      const x = MARGEM + i * (larguraNivel + 3)
      cartao(p, x, larguraNivel, 17, COR.creme)
      p.fonte(8, 'normal', COR.tintaSuave)
      const nome = doc.splitTextToSize(atividade.nome, larguraNivel - 4) as string[]
      doc.text(nome.slice(0, 2), x + larguraNivel / 2, p.y + 4.3, { align: 'center' })
      p.fonte(11.5, 'bold')
      doc.text(`Nível ${dados.aluno.niveis[atividade.id]}`, x + larguraNivel / 2, p.y + 14, {
        align: 'center',
      })
    })
    p.y += 20
  }
  p.y += 1
}

function secaoAnalise(p: Pagina, analise: TextoAnalise) {
  p.titulo('Análise do período', 25)
  for (const paragrafo of analise.visaoGeral) {
    p.paragrafo(paragrafo)
    p.y += 2
  }
  for (const [titulo, campo] of SECOES_ANALISE) p.itens(titulo, analise[campo])
  // Aviso numa faixa clara
  p.y += 2
  const linhas = p.doc.splitTextToSize(AVISO_ANALISE, UTIL - 8) as string[]
  const altura = linhas.length * p.linha(9) + 5
  p.garantir(altura)
  cartao(p, MARGEM, UTIL, altura, COR.sol)
  p.fonte(9, 'normal', COR.tintaSuave)
  p.doc.text(linhas, MARGEM + 4, p.y + 5.2)
  p.y += altura + 2
}

function grafico(p: Pagina, x: number, largura: number, sessoes: readonly Sessao[], nome: string) {
  const { doc } = p
  const pontos = serieGrafico(sessoes)
  const media = resumir(sessoes).taxaMedia
  const altura = 52
  cartao(p, x, largura, altura, COR.branco)
  p.fonte(10.5, 'bold')
  doc.text(nome, x + 4, p.y + 6)
  p.fonte(8.5, 'normal', COR.tintaSuave)
  const rodadas = `${pontos.length} ${pontos.length === 1 ? 'rodada' : 'rodadas'}`
  doc.text(
    `${rodadas} · acerto médio ${media === null ? '—' : formatarPorcentagem(media)}`,
    x + 4,
    p.y + 10.5,
  )

  // Área do gráfico
  const gx = x + 13
  const gy = p.y + 15
  const gl = largura - 18
  const ga = altura - 24
  const yDe = (taxa: number) => gy + ga - (taxa / 100) * ga
  doc.setLineWidth(0.25)
  for (const marca of [0, 50, 100]) {
    doc.setDrawColor(...COR.borda)
    doc.line(gx, yDe(marca), gx + gl, yDe(marca))
    p.fonte(7.5, 'normal', COR.tintaSuave)
    doc.text(`${marca}%`, gx - 2, yDe(marca) + 1, { align: 'right' })
  }
  const xDe = (i: number) =>
    pontos.length === 1 ? gx + gl / 2 : gx + (i * gl) / (pontos.length - 1)
  doc.setDrawColor(...COR.azul)
  doc.setLineWidth(0.6)
  for (let i = 1; i < pontos.length; i++) {
    doc.line(xDe(i - 1), yDe(pontos[i - 1].taxa), xDe(i), yDe(pontos[i].taxa))
  }
  doc.setFillColor(...COR.azul)
  doc.setDrawColor(...COR.branco)
  doc.setLineWidth(0.3)
  pontos.forEach((ponto, i) => doc.circle(xDe(i), yDe(ponto.taxa), 0.9, 'FD'))
  // Eixo x: primeira e última rodada
  p.fonte(7.5, 'normal', COR.tintaSuave)
  doc.text('rodada 1', gx, gy + ga + 4.5)
  if (pontos.length > 1) {
    doc.text(`rodada ${pontos.length}`, gx + gl, gy + ga + 4.5, { align: 'right' })
  }
  return altura
}

function secaoGraficos(p: Pagina, dados: DadosRelatorio) {
  const jogadas = ATIVIDADES.filter((a) => dados.sessoes.some((s) => s.atividadeId === a.id))
  if (jogadas.length === 0) return
  p.titulo('Evolução da taxa de acerto', 56)
  const largura = (UTIL - 4) / 2
  for (let i = 0; i < jogadas.length; i += 2) {
    p.garantir(56)
    let alturaLinha = 0
    for (const [j, atividade] of jogadas.slice(i, i + 2).entries()) {
      const daAtividade = dados.sessoes.filter((s) => s.atividadeId === atividade.id)
      const x = MARGEM + j * (largura + 4)
      alturaLinha = Math.max(alturaLinha, grafico(p, x, largura, daAtividade, atividade.nome))
    }
    p.y += alturaLinha + 4
  }
}

const ALINHAMENTO_COLUNAS = [
  'left',
  'left',
  'center',
  'center',
  'center',
  'center',
  'right',
] as const

function secaoHistorico(p: Pagina, dados: DadosRelatorio) {
  p.titulo('Histórico', 20)
  autoTable(p.doc, {
    startY: p.y,
    margin: { left: MARGEM, right: MARGEM, top: MARGEM, bottom: ALTURA - FIM_CONTEUDO + 2 },
    head: [['Data', 'Atividade', 'Nível', 'Acertos', 'Erros', 'Acerto', 'Duração']],
    body: dados.sessoes.map((s) => [
      formatarDataHora(s.concluidaEm),
      buscarAtividade(s.atividadeId)?.nome ?? '',
      String(s.nivel),
      String(s.acertos),
      String(s.erros),
      formatarPorcentagem(taxaAcerto(s)),
      formatarDuracao(s.duracaoSeg),
    ]),
    styles: {
      font: FONTE,
      fontSize: 9,
      textColor: COR.tinta,
      cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2.5 },
      lineColor: COR.borda,
      lineWidth: { bottom: 0.2 },
    },
    headStyles: { font: FONTE, fontStyle: 'bold', fillColor: COR.creme, textColor: COR.tintaSuave },
    alternateRowStyles: { fillColor: [0xfd, 0xfb, 0xf7] },
    columnStyles: {
      0: { cellWidth: 32 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right' },
    },
    // O cabeçalho segue o alinhamento de cada coluna.
    didParseCell: ({ section, column, cell }) => {
      if (section === 'head') cell.styles.halign = ALINHAMENTO_COLUNAS[column.index] ?? 'left'
    },
  })
}

function rodapes(doc: jsPDF) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COR.borda)
    doc.setLineWidth(0.3)
    doc.line(MARGEM, ALTURA - 13, LARGURA - MARGEM, ALTURA - 13)
    doc.setFont(FONTE, 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...COR.tintaSuave)
    doc.text('Gerado por EducAEE – www.educaee.com.br', MARGEM, ALTURA - 8.5)
    doc.text(`Página ${i} de ${total}`, LARGURA - MARGEM, ALTURA - 8.5, { align: 'right' })
  }
}

/** Monta o PDF e devolve o arquivo (Blob). */
export async function gerarRelatorioPdf(dados: DadosRelatorio): Promise<Blob> {
  const emitidoEm = dados.emitidoEm ?? new Date()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({
    title: `EducAEE – Relatório de progresso – ${dados.aluno.nome}`,
    author: 'EducAEE',
    creator: 'EducAEE (www.educaee.com.br)',
  })
  await prepararFontes(doc)
  const p = new Pagina(doc)
  cabecalho(p, dados, emitidoEm)
  resumo(p, dados)
  if (dados.analise) secaoAnalise(p, dados.analise)
  secaoGraficos(p, dados)
  if (dados.sessoes.length > 0) secaoHistorico(p, dados)
  rodapes(doc)
  return doc.output('blob')
}

/** Gera e baixa o PDF (sem janela de impressão). */
export async function baixarRelatorioPdf(dados: DadosRelatorio): Promise<void> {
  const blob = await gerarRelatorioPdf(dados)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivoRelatorio(dados.aluno.nome, dados.emitidoEm ?? new Date())
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
