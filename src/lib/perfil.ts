/** Perfil de acessibilidade e preferências do aluno (seção 5 da especificação). */

export type Tamanho = 'normal' | 'grande' | 'muito_grande'
export type Contraste = 'normal' | 'alto'
export type VelocidadeVoz = 'lenta' | 'normal'
export type Tema = 'animais' | 'dinossauros' | 'veiculos' | 'frutas' | 'espaco'

export interface Perfil {
  tamanho: Tamanho
  contraste: Contraste
  sons: boolean
  animacoesReduzidas: boolean
  leituraVoz: boolean
  velocidadeVoz: VelocidadeVoz
  tema: Tema
}

export const PERFIL_PADRAO: Perfil = {
  tamanho: 'grande',
  contraste: 'normal',
  sons: true,
  animacoesReduzidas: false,
  leituraVoz: true,
  velocidadeVoz: 'lenta',
  tema: 'animais',
}

/** Área mínima de toque (em px) de botões, cartas e alvos nas atividades. */
export const AREA_TOQUE: Record<Tamanho, number> = {
  normal: 64,
  grande: 88,
  muito_grande: 120,
}

/** Valor de `rate` do speechSynthesis para cada velocidade da voz. */
export const VELOCIDADE_FALA: Record<VelocidadeVoz, number> = {
  lenta: 0.8,
  normal: 1,
}

const TAMANHOS: readonly Tamanho[] = ['normal', 'grande', 'muito_grande']
const CONTRASTES: readonly Contraste[] = ['normal', 'alto']
const VELOCIDADES: readonly VelocidadeVoz[] = ['lenta', 'normal']
export const TEMAS_IDS: readonly Tema[] = ['animais', 'dinossauros', 'veiculos', 'frutas', 'espaco']

function opcao<T extends string>(valor: unknown, validos: readonly T[], padrao: T): T {
  return validos.find((v) => v === valor) ?? padrao
}

function booleano(valor: unknown, padrao: boolean): boolean {
  return typeof valor === 'boolean' ? valor : padrao
}

/** Lê um perfil vindo do banco, trocando qualquer valor inválido ou ausente pelo padrão. */
export function lerPerfil(dados: unknown): Perfil {
  const p = typeof dados === 'object' && dados !== null ? (dados as Record<string, unknown>) : {}
  return {
    tamanho: opcao(p.tamanho, TAMANHOS, PERFIL_PADRAO.tamanho),
    contraste: opcao(p.contraste, CONTRASTES, PERFIL_PADRAO.contraste),
    sons: booleano(p.sons, PERFIL_PADRAO.sons),
    animacoesReduzidas: booleano(p.animacoesReduzidas, PERFIL_PADRAO.animacoesReduzidas),
    leituraVoz: booleano(p.leituraVoz, PERFIL_PADRAO.leituraVoz),
    velocidadeVoz: opcao(p.velocidadeVoz, VELOCIDADES, PERFIL_PADRAO.velocidadeVoz),
    tema: opcao(p.tema, TEMAS_IDS, PERFIL_PADRAO.tema),
  }
}
