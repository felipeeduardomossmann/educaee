import type { User } from 'firebase/auth'
import {
  chamarApi,
  consultarRestantesApi,
  lerCodigoErro,
  lerRestantes,
  type CodigoErroApi,
  type Restantes,
} from './api'

// Desenhos para colorir: o navegador só fala com /api/desenho (a IA roda no servidor).
// Os desenhos não são salvos no banco; ficam só na memória desta visita.

export type { Restantes }
export type CodigoErroDesenho = CodigoErroApi

export const TAMANHO_MAXIMO_TEMA = 100
export const DESENHOS_POR_PEDIDO = 2

export type ResultadoDesenho =
  | { ok: true; imagem: string; restantes: Restantes }
  | { ok: false; codigo: CodigoErroDesenho; restantes?: Restantes }

export const MENSAGENS_ERRO: Record<CodigoErroDesenho, string> = {
  'sem-login': 'Sua sessão expirou. Saia e entre de novo para continuar.',
  'dados-invalidos': 'Escreva um tema com até 100 caracteres.',
  'limite-dia': 'Você já criou todos os desenhos de hoje. Amanhã tem mais!',
  'limite-mes':
    'Os desenhos deste mês acabaram para o site todo. Eles voltam no dia 1º do mês que vem.',
  recusado: 'Não foi possível criar esse desenho. Tente outro tema.',
  falha: 'Não foi possível criar o desenho agora. Verifique a internet e tente de novo.',
  // Só acontece nos vídeos; aqui fica igual a uma falha.
  'cota-youtube': 'Não foi possível criar o desenho agora. Verifique a internet e tente de novo.',
}

export function consultarRestantes(usuario: User): Promise<Restantes | null> {
  return consultarRestantesApi(usuario, '/api/desenho')
}

export async function gerarDesenho(usuario: User, tema: string): Promise<ResultadoDesenho> {
  try {
    const { resposta, dados } = await chamarApi(usuario, '/api/desenho', { tema })
    const restantes = lerRestantes(dados)
    const imagem = (dados as { imagem?: unknown } | null)?.imagem
    if (resposta.ok && typeof imagem === 'string' && restantes) {
      return { ok: true, imagem, restantes }
    }
    return { ok: false, codigo: lerCodigoErro(dados), restantes }
  } catch {
    return { ok: false, codigo: 'falha' }
  }
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image()
    imagem.onload = () => resolver(imagem)
    imagem.onerror = () => rejeitar(new Error('Imagem inválida'))
    imagem.src = src
  })
}

/** Converte o JPEG da IA em PNG em tons de cinza, com o quase-branco virando branco. */
export async function paraPng(imagemJpeg: string): Promise<Blob> {
  const imagem = await carregarImagem(imagemJpeg)
  const canvas = document.createElement('canvas')
  canvas.width = imagem.naturalWidth
  canvas.height = imagem.naturalHeight
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('Canvas indisponível')
  contexto.drawImage(imagem, 0, 0)
  const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height)
  const d = pixels.data
  for (let i = 0; i < d.length; i += 4) {
    const cinza = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    const valor = cinza >= 235 ? 255 : cinza
    d[i] = d[i + 1] = d[i + 2] = valor
  }
  contexto.putImageData(pixels, 0, 0)
  return new Promise((resolver, rejeitar) =>
    canvas.toBlob((blob) => (blob ? resolver(blob) : rejeitar(new Error('PNG'))), 'image/png'),
  )
}

/** Nome do arquivo: "desenho-dinossauros-na-lua-1.png". */
export function nomeArquivo(tema: string, numero: number): string {
  const base = tema
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return `desenho-${base || 'colorir'}-${numero}.png`
}

export async function baixarPng(imagemJpeg: string, tema: string, numero: number) {
  const url = URL.createObjectURL(await paraPng(imagemJpeg))
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo(tema, numero)
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Imprime só o desenho: uma folha A4 em pé, desenho grande e centralizado. */
export async function imprimirDesenho(imagemJpeg: string, titulo: string) {
  const url = URL.createObjectURL(await paraPng(imagemJpeg))
  const quadro = document.createElement('iframe')
  quadro.setAttribute('aria-hidden', 'true')
  quadro.tabIndex = -1
  quadro.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  const tituloSeguro = titulo.replace(/[<>&"]/g, '')
  quadro.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${tituloSeguro}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  html, body { margin: 0; background: #fff; }
  img { display: block; width: 190mm; height: 277mm; object-fit: contain; margin: 0 auto; }
</style></head><body><img src="${url}" alt=""></body></html>`
  const limpar = () => {
    quadro.remove()
    URL.revokeObjectURL(url)
  }
  quadro.onload = () => {
    const janela = quadro.contentWindow
    const imagem = quadro.contentDocument?.querySelector('img')
    if (!janela || !imagem) return limpar()
    const imprimir = () => {
      janela.addEventListener('afterprint', () => setTimeout(limpar, 500), { once: true })
      janela.focus()
      janela.print()
    }
    if (imagem.complete) imprimir()
    else imagem.addEventListener('load', imprimir, { once: true })
  }
  document.body.append(quadro)
}
