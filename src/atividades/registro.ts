import type { DefinicaoAtividade } from './tipos'

/** Todas as atividades, na ordem em que aparecem. */
export const ATIVIDADES: readonly DefinicaoAtividade[] = [
  {
    id: 'memoria',
    nome: 'Jogo da memória',
    habilidade: 'Memória',
    descricao: 'Vire as cartas e encontre os pares.',
    icone: 'cartas',
    carregar: () => import('./memoria/Memoria'),
  },
  {
    id: 'igual',
    nome: 'Encontre o igual',
    habilidade: 'Atenção',
    descricao: 'Toque na figura igual à de cima.',
    icone: 'lupa',
    carregar: () => import('./igual/Igual'),
  },
  {
    id: 'alvo',
    nome: 'Toque no alvo',
    habilidade: 'Coordenação motora',
    descricao: 'Toque na figura que aparece na tela.',
    icone: 'alvo',
    carregar: () => import('./alvo/Alvo'),
  },
  {
    id: 'letras',
    nome: 'Letras e sílabas',
    habilidade: 'Alfabetização',
    descricao: 'Ouça e toque na letra, sílaba ou palavra certa.',
    icone: 'abc',
    carregar: () => import('./letras/Letras'),
    precisaVoz: true,
  },
  {
    id: 'sequencia',
    nome: 'Complete a sequência',
    habilidade: 'Lógica',
    descricao: 'Descubra o que vem depois.',
    icone: 'quebra-cabeca',
    carregar: () => import('./sequencia/Sequencia'),
  },
  {
    id: 'contar',
    nome: 'Contar',
    habilidade: 'Matemática',
    descricao: 'Conte as figuras e toque no número.',
    icone: 'numeros',
    carregar: () => import('./contar/Contar'),
  },
  {
    id: 'emocoes',
    nome: 'Emoções',
    habilidade: 'Emoções',
    descricao: 'Reconheça como as pessoas se sentem.',
    icone: 'rosto-feliz',
    carregar: () => import('./emocoes/Emocoes'),
    precisaVoz: true,
  },
  {
    id: 'caminhos',
    nome: 'Caminhos',
    habilidade: 'Coordenação motora',
    descricao: 'Arraste a figura pelo caminho até o fim.',
    icone: 'caminho',
    carregar: () => import('./caminhos/Caminhos'),
  },
  {
    id: 'pares',
    nome: 'Pares que combinam',
    habilidade: 'Memória',
    descricao: 'Encontre as figuras que combinam (e as sombras).',
    icone: 'elo',
    carregar: () => import('./pares/Pares'),
  },
  {
    id: 'pegue',
    nome: 'Pegue só o...',
    habilidade: 'Atenção',
    descricao: 'Toque só na figura pedida.',
    icone: 'mao',
    carregar: () => import('./pegue/Pegue'),
    precisaVoz: true,
  },
  {
    id: 'segure',
    nome: 'Toque e segure',
    habilidade: 'Coordenação motora',
    descricao: 'Segure até o círculo encher.',
    icone: 'ampulheta',
    carregar: () => import('./segure/Segure'),
  },
  {
    id: 'sombra',
    nome: 'Qual é a sombra?',
    habilidade: 'Atenção',
    descricao: 'Encontre a sombra da figura.',
    icone: 'silhueta',
    carregar: () => import('./sombra/Sombra'),
  },
  {
    id: 'faltando',
    nome: 'O que está faltando?',
    habilidade: 'Memória',
    descricao: 'Olhe as figuras e descubra qual sumiu.',
    icone: 'interrogacao',
    carregar: () => import('./faltando/Faltando'),
  },
  {
    id: 'sons',
    nome: 'Sons das palavras',
    habilidade: 'Alfabetização',
    descricao: 'Ache a palavra que começa com o som ou que rima.',
    icone: 'orelha',
    carregar: () => import('./sons/Sons'),
    precisaVoz: true,
  },
  {
    id: 'monte',
    nome: 'Monte a palavra',
    habilidade: 'Alfabetização',
    descricao: 'Toque nas sílabas na ordem para formar o nome da figura.',
    icone: 'bloco-de-notas',
    carregar: () => import('./monte/Monte'),
  },
  {
    id: 'rotina',
    nome: 'Rotina do dia',
    habilidade: 'Lógica',
    descricao: 'Coloque as cenas na ordem em que acontecem.',
    icone: 'calendario',
    carregar: () => import('./rotina/Rotina'),
  },
]

export function buscarAtividade(id: string | undefined): DefinicaoAtividade | undefined {
  return ATIVIDADES.find((atividade) => atividade.id === id)
}

/** Atividades agrupadas por habilidade, na ordem do registro. */
export function agruparPorHabilidade(): { habilidade: string; atividades: DefinicaoAtividade[] }[] {
  const grupos = new Map<string, DefinicaoAtividade[]>()
  for (const atividade of ATIVIDADES) {
    grupos.set(atividade.habilidade, [...(grupos.get(atividade.habilidade) ?? []), atividade])
  }
  return [...grupos].map(([habilidade, atividades]) => ({ habilidade, atividades }))
}

// Fica fora do build de produção (import.meta.env.DEV vira false e o código é descartado).
const carregarSimulada = import.meta.env.DEV
  ? () => import('./simulada/AtividadeSimulada')
  : undefined

/** Carregador da atividade; em dev, as que não existem usam a simulada. */
export function carregadorDe(atividade: DefinicaoAtividade): DefinicaoAtividade['carregar'] {
  return atividade.carregar ?? carregarSimulada
}
