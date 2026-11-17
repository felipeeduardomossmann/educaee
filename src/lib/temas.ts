import type { NomeFigura } from './figuras'
import type { Tema } from './perfil'

interface DadosTema {
  nome: string
  /** Figura que representa o tema (nos seletores e na prévia). */
  icone: NomeFigura
  /** Figuras usadas nas atividades: no mínimo 12, todas diferentes. */
  figuras: readonly NomeFigura[]
}

export const TEMAS: Record<Tema, DadosTema> = {
  animais: {
    nome: 'Animais',
    icone: 'cachorro',
    figuras: [
      'cachorro',
      'gato',
      'peixe',
      'passaro',
      'coelho',
      'vaca',
      'porco',
      'leao',
      'macaco',
      'tartaruga',
      'sapo',
      'abelha',
    ],
  },
  dinossauros: {
    nome: 'Dinossauros',
    icone: 'dinossauro',
    figuras: [
      'dinossauro',
      'tiranossauro-rex',
      'ovo',
      'vulcao',
      'pegada',
      'folha',
      'osso',
      'palmeira',
      'pedra',
      'cometa',
      'lagarto',
      'crocodilo',
      'samambaia',
    ],
  },
  veiculos: {
    nome: 'Veículos',
    icone: 'carro',
    figuras: [
      'carro',
      'onibus',
      'caminhao',
      'moto',
      'bicicleta',
      'aviao',
      'barco',
      'trem',
      'foguete',
      'trator',
      'ambulancia',
      'viatura',
      'caminhao-de-bombeiros',
      'helicoptero',
    ],
  },
  frutas: {
    nome: 'Frutas',
    icone: 'maca',
    figuras: [
      'maca',
      'banana',
      'uva',
      'morango',
      'laranja',
      'melancia',
      'abacaxi',
      'pera',
      'cereja',
      'limao',
      'kiwi',
      'manga',
      'pessego',
    ],
  },
  espaco: {
    nome: 'Espaço',
    icone: 'foguete',
    figuras: [
      'foguete',
      'lua',
      'sol',
      'estrela',
      'planeta',
      'astronauta',
      'cometa',
      'satelite',
      'et',
      'telescopio',
      'terra',
      'disco-voador',
    ],
  },
}
