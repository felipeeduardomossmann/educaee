// Prancha de comunicação em PDF (A4 retrato) para imprimir e recortar. Carregado só no clique.

import { jsPDF } from 'jspdf'
import { urlFigura } from '../lib/figuras'
import { redimensionar } from '../lib/pictogramas'
import { FONTE, prepararFontes } from '../lib/relatorio-pdf'
import type { CartaoPrancha } from './prancha'
import { CATEGORIAS, CORES_PDF } from './vocabulario'

const LARGURA = 210
const ALTURA = 297
const MARGEM = 14
const COLUNAS = 3
const ESPACO = 6
const LADO = (LARGURA - 2 * MARGEM - (COLUNAS - 1) * ESPACO) / COLUNAS
const ALTURA_CARTAO = LADO + 2

async function imagemPng(cartao: CartaoPrancha): Promise<string> {
  const src = cartao.figura ? urlFigura(cartao.figura) : (cartao.imagem ?? '')
  return redimensionar(src, 360, 'image/png')
}

/** "EducAEE_Prancha_Ana_Clara.pdf" */
export function nomeArquivoPrancha(nome: string | null): string {
  const limpo = (nome ?? 'padrao')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `EducAEE_Prancha_${limpo || 'padrao'}.pdf`
}

export async function gerarPranchaPdf(
  cartoes: readonly CartaoPrancha[],
  nomeAluno: string | null,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title: 'EducAEE – Prancha de comunicação', author: 'EducAEE' })
  await prepararFontes(doc)
  const imagens = new Map(
    await Promise.all(
      cartoes.map(async (c) => [c.id, await imagemPng(c).catch(() => null)] as const),
    ),
  )

  let y = MARGEM
  const cabecalho = () => {
    doc.setFont(FONTE, 'bold')
    doc.setFontSize(16)
    doc.setTextColor(0x1f, 0x2d, 0x3d)
    doc.text('Educ', MARGEM, MARGEM + 5)
    doc.setTextColor(0xc8, 0x41, 0x0b)
    doc.text('AEE', MARGEM + doc.getTextWidth('Educ'), MARGEM + 5)
    doc.setFont(FONTE, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0x4a, 0x58, 0x68)
    doc.text(
      `Prancha de comunicação${nomeAluno ? ` – ${nomeAluno}` : ''}`,
      LARGURA - MARGEM,
      MARGEM + 5,
      { align: 'right' },
    )
    y = MARGEM + 12
  }
  cabecalho()

  for (const categoria of CATEGORIAS) {
    const daCategoria = cartoes.filter((c) => c.categoria === categoria.id)
    if (daCategoria.length === 0) continue
    // Título da categoria numa faixa da cor dela (nova página se não couber a 1ª linha).
    if (y + 10 + ALTURA_CARTAO > ALTURA - MARGEM) {
      doc.addPage()
      cabecalho()
    }
    doc.setFillColor(...CORES_PDF[categoria.id])
    doc.roundedRect(MARGEM, y, LARGURA - 2 * MARGEM, 9, 2, 2, 'F')
    doc.setFont(FONTE, 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0x1f, 0x2d, 0x3d)
    doc.text(categoria.nome, MARGEM + 4, y + 6.2)
    y += 13

    for (let i = 0; i < daCategoria.length; i += COLUNAS) {
      if (y + ALTURA_CARTAO > ALTURA - MARGEM) {
        doc.addPage()
        cabecalho()
      }
      daCategoria.slice(i, i + COLUNAS).forEach((cartao, j) => {
        const x = MARGEM + j * (LADO + ESPACO)
        // Linha de corte suave (tracejada) e fundo da categoria.
        doc.setFillColor(...CORES_PDF[categoria.id])
        doc.roundedRect(x, y, LADO, ALTURA_CARTAO, 4, 4, 'F')
        doc.setDrawColor(0xb0, 0xb8, 0xc2)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([2, 1.5], 0)
        doc.roundedRect(x - 1.5, y - 1.5, LADO + 3, ALTURA_CARTAO + 3, 5, 5, 'S')
        doc.setLineDashPattern([], 0)
        const imagem = imagens.get(cartao.id)
        const ladoImagem = LADO * 0.62
        if (imagem) {
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(
            x + (LADO - ladoImagem) / 2 - 2,
            y + 4,
            ladoImagem + 4,
            ladoImagem + 4,
            3,
            3,
            'F',
          )
          doc.addImage(imagem, 'PNG', x + (LADO - ladoImagem) / 2, y + 6, ladoImagem, ladoImagem)
        }
        doc.setFont(FONTE, 'bold')
        doc.setFontSize(15)
        doc.setTextColor(0x1f, 0x2d, 0x3d)
        const linhas = doc.splitTextToSize(cartao.palavra, LADO - 6) as string[]
        doc.text(linhas.slice(0, 2), x + LADO / 2, y + ladoImagem + 16, { align: 'center' })
      })
      y += ALTURA_CARTAO + ESPACO
    }
    y += 2
  }
  return doc.output('blob')
}

export async function baixarPranchaPdf(
  cartoes: readonly CartaoPrancha[],
  nomeAluno: string | null,
): Promise<void> {
  const url = URL.createObjectURL(await gerarPranchaPdf(cartoes, nomeAluno))
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivoPrancha(nomeAluno)
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
