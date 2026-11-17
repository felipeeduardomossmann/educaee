// Lógica pura dos "Desenhos para colorir" (sem rede nem banco), testada em desenho.test.ts.
// Arquivos em api/_lib não viram rotas na Vercel (começam com "_").

import { FILTROS_SEGURANCA } from './gemini.js'

export const TAMANHO_MAXIMO_TEMA = 100

export const MODELO = 'gemini-nano-banana-2.1'

/** Limpa o tema (sem controles nem aspas, espaços juntos); null se vazio ou longo demais. */
export function limparTema(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  const tema = bruto
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/["“”«»`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (tema.length === 0 || tema.length > TAMANHO_MAXIMO_TEMA) return null
  return tema
}

/** Prompt fixo (em inglês): o pedido da professora só entra como tema, entre aspas. */
export function montarPrompt(tema: string): string {
  return [
    `Children's coloring page of: "${tema}".`,
    'Black and white line art only: thick bold black outlines on a pure white background.',
    'No shading, no gray, no color, no filled areas, no text, no letters, no numbers.',
    'Simple, large, clearly separated shapes with few small details, easy for young children to color.',
    'Friendly scene suitable for young children: no violence, weapons, blood or scary content.',
    'Original artwork: no logos, brands, or copyrighted or trademarked characters.',
    'One centered scene filling the page.',
  ].join(' ')
}

/** Corpo da chamada à Interactions API do Gemini (retrato 3:4, 1K, filtros no máximo). */
export function corpoPedido(tema: string) {
  return {
    model: MODELO,
    // Não guardar a interação do lado do Google (não usamos conversa com várias etapas).
    store: false,
    input: [{ type: 'text', text: montarPrompt(tema) }],
    // Raciocínio mínimo: nos testes, a qualidade ficou igual à do padrão ("medium"), sem
    // tokens de raciocínio (que são cobrados).
    generation_config: { thinking_level: 'minimal' },
    response_format: {
      type: 'image',
      mime_type: 'image/jpeg',
      aspect_ratio: '3:4',
      image_size: '1K',
    },
    safety_settings: FILTROS_SEGURANCA,
  }
}

export interface ImagemGerada {
  data: string
  mimeType: string
}

/** Acha a imagem na resposta (passo "model_output"). Sem imagem = a IA não desenhou. */
export function extrairImagem(resposta: unknown): ImagemGerada | null {
  if (!resposta || typeof resposta !== 'object') return null
  const passos = (resposta as { steps?: unknown }).steps
  if (!Array.isArray(passos)) return null
  for (const passo of passos as { type?: unknown; content?: unknown }[]) {
    if (passo?.type !== 'model_output' || !Array.isArray(passo.content)) continue
    for (const parte of passo.content as {
      type?: unknown
      data?: unknown
      mime_type?: unknown
    }[]) {
      if (parte?.type === 'image' && typeof parte.data === 'string' && parte.data.length > 0) {
        const mimeType = typeof parte.mime_type === 'string' ? parte.mime_type : 'image/jpeg'
        return { data: parte.data, mimeType }
      }
    }
  }
  return null
}
