export type VarianteBotao = 'primario' | 'secundario' | 'suave'
export type TamanhoBotao = 'normal' | 'grande'

const base =
  'inline-flex items-center justify-center gap-3 rounded-2xl font-bold transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50'

const variantes: Record<VarianteBotao, string> = {
  primario: 'bg-azul text-sobre-cor shadow-suave hover:bg-azul-escuro',
  secundario: 'border-2 border-azul bg-white text-azul-escuro shadow-suave hover:bg-ceu',
  suave: 'text-azul-escuro hover:bg-ceu',
}

const tamanhos: Record<TamanhoBotao, string> = {
  normal: 'min-h-12 px-5 text-base',
  grande: 'min-h-16 px-8 text-xl',
}

export function classesBotao(
  variante: VarianteBotao = 'primario',
  tamanho: TamanhoBotao = 'normal',
  extra = '',
): string {
  return `${base} ${variantes[variante]} ${tamanhos[tamanho]} ${extra}`
}
