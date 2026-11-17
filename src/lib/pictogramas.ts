import type { User } from 'firebase/auth'
import { chamarApi, lerCodigoErro, lerRestantes, type CodigoErroApi, type Restantes } from './api'

// Pictogramas da prancha gerados por IA (/api/pictograma). Contam no limite dos desenhos.

export type ResultadoPictograma =
  | { ok: true; imagens: string[]; audio: string | null; restantes: Restantes }
  | { ok: false; codigo: CodigoErroApi; restantes?: Restantes }

export const MENSAGENS_ERRO_PICTOGRAMA: Record<CodigoErroApi, string> = {
  'sem-login': 'Sua sessão expirou. Saia e entre de novo para continuar.',
  'dados-invalidos': 'Escreva uma palavra com até 30 caracteres.',
  'limite-dia': 'Você já criou todas as imagens de hoje (desenhos e pictogramas). Amanhã tem mais!',
  'limite-mes':
    'As imagens deste mês acabaram para o site todo. Elas voltam no dia 1º do mês que vem.',
  'cota-youtube': 'Não foi possível criar o pictograma agora. Tente de novo.',
  recusado: 'Não foi possível criar esse pictograma. Tente outra palavra.',
  falha: 'Não foi possível criar o pictograma agora. Verifique a internet e tente de novo.',
}

export async function gerarPictogramas(
  usuario: User,
  palavra: string,
): Promise<ResultadoPictograma> {
  try {
    const { resposta, dados } = await chamarApi(usuario, '/api/pictograma', { palavra })
    const restantes = lerRestantes(dados)
    const d = dados as { imagens?: unknown; audio?: unknown } | null
    const imagens = Array.isArray(d?.imagens)
      ? d.imagens.filter((i): i is string => typeof i === 'string' && i.startsWith('data:image/'))
      : []
    const audio =
      typeof d?.audio === 'string' && d.audio.startsWith('data:audio/mpeg;base64,') ? d.audio : null
    if (resposta.ok && imagens.length > 0 && restantes) {
      return { ok: true, imagens, audio, restantes }
    }
    return { ok: false, codigo: lerCodigoErro(dados), restantes }
  } catch {
    return { ok: false, codigo: 'falha' }
  }
}

export function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image()
    imagem.onload = () => resolver(imagem)
    imagem.onerror = () => rejeitar(new Error('Imagem inválida'))
    imagem.src = src
  })
}

/** Imagem → quadrado de `lado` px (fundo branco) em data URL, no formato pedido. */
export async function redimensionar(
  src: string,
  lado: number,
  formato: 'image/webp' | 'image/png' = 'image/webp',
  qualidade = 0.8,
): Promise<string> {
  const imagem = await carregarImagem(src)
  const canvas = document.createElement('canvas')
  canvas.width = lado
  canvas.height = lado
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('Canvas indisponível')
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, lado, lado)
  const escala = Math.min(lado / imagem.naturalWidth, lado / imagem.naturalHeight)
  const l = imagem.naturalWidth * escala
  const a = imagem.naturalHeight * escala
  contexto.drawImage(imagem, (lado - l) / 2, (lado - a) / 2, l, a)
  const resultado = canvas.toDataURL(formato, qualidade)
  // Navegadores sem WebP devolvem PNG: aceito pelas regras do mesmo jeito.
  return resultado
}
