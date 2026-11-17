// Lógica pura dos pictogramas da prancha (CAA), testada em pictograma.test.ts.

import { FILTROS_SEGURANCA } from './gemini.js'
import { MODELO } from './desenho.js'

export const TAMANHO_MAXIMO_PALAVRA = 30
export const OPCOES_PICTOGRAMA = 2

/** Limpa a palavra do cartão (como o tema dos desenhos). null se vazia ou longa demais. */
export function limparPalavra(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  const palavra = bruto
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/["“”«»`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (palavra.length === 0 || palavra.length > TAMANHO_MAXIMO_PALAVRA) return null
  return palavra
}

/** Prompt fixo (em inglês): a palavra da professora só entra entre aspas. */
export function montarPrompt(palavra: string): string {
  return [
    `AAC communication board pictogram for the Brazilian Portuguese word "${palavra}".`,
    'Simple flat colorful illustration with a clear dark outline, on a pure white background.',
    'One single object or idea, centered, large, easy to recognize by young children.',
    'No text, no letters, no numbers, no real people, no photos, no logos or brands.',
    'Friendly and calm, suitable for children.',
  ].join(' ')
}

export function corpoPedidoPictograma(palavra: string) {
  return {
    model: MODELO,
    store: false,
    input: [{ type: 'text', text: montarPrompt(palavra) }],
    generation_config: { thinking_level: 'minimal' },
    response_format: {
      type: 'image',
      mime_type: 'image/jpeg',
      aspect_ratio: '1:1',
      image_size: '1K',
    },
    safety_settings: FILTROS_SEGURANCA,
  }
}

/** A fala do cartão (igual à do navegador: primeira letra maiúscula e ponto). */
export function falaDoCartao(palavra: string): string {
  return `${palavra.charAt(0).toUpperCase()}${palavra.slice(1)}.`
}
