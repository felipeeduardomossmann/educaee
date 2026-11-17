import type { NomeFigura } from './figuras'

// Nome das figuras como a voz fala (com acento, plural e gênero). Os ids dos arquivos não têm
// acento ("maca" é maçã), por isso esta tabela. Só as figuras que aparecem em falas.

export interface NomeFalado {
  nome: string
  plural: string
  /** m = "o gato", f = "a maçã". */
  genero: 'm' | 'f'
}

const LISTA: [NomeFigura, string, string, 'm' | 'f'][] = [
  // Animais
  ['cachorro', 'cachorro', 'cachorros', 'm'],
  ['gato', 'gato', 'gatos', 'm'],
  ['peixe', 'peixe', 'peixes', 'm'],
  ['passaro', 'pássaro', 'pássaros', 'm'],
  ['coelho', 'coelho', 'coelhos', 'm'],
  ['vaca', 'vaca', 'vacas', 'f'],
  ['porco', 'porco', 'porcos', 'm'],
  ['leao', 'leão', 'leões', 'm'],
  ['macaco', 'macaco', 'macacos', 'm'],
  ['tartaruga', 'tartaruga', 'tartarugas', 'f'],
  ['sapo', 'sapo', 'sapos', 'm'],
  ['abelha', 'abelha', 'abelhas', 'f'],
  ['pato', 'pato', 'patos', 'm'],
  ['foca', 'foca', 'focas', 'f'],
  ['rato', 'rato', 'ratos', 'm'],
  // Dinossauros
  ['dinossauro', 'dinossauro', 'dinossauros', 'm'],
  ['tiranossauro-rex', 'tiranossauro', 'tiranossauros', 'm'],
  ['ovo', 'ovo', 'ovos', 'm'],
  ['vulcao', 'vulcão', 'vulcões', 'm'],
  ['pegada', 'pegada', 'pegadas', 'f'],
  ['folha', 'folha', 'folhas', 'f'],
  ['osso', 'osso', 'ossos', 'm'],
  ['palmeira', 'palmeira', 'palmeiras', 'f'],
  ['pedra', 'pedra', 'pedras', 'f'],
  ['cometa', 'cometa', 'cometas', 'm'],
  ['lagarto', 'lagarto', 'lagartos', 'm'],
  ['crocodilo', 'crocodilo', 'crocodilos', 'm'],
  ['samambaia', 'samambaia', 'samambaias', 'f'],
  // Veículos
  ['carro', 'carro', 'carros', 'm'],
  ['onibus', 'ônibus', 'ônibus', 'm'],
  ['caminhao', 'caminhão', 'caminhões', 'm'],
  ['moto', 'moto', 'motos', 'f'],
  ['bicicleta', 'bicicleta', 'bicicletas', 'f'],
  ['aviao', 'avião', 'aviões', 'm'],
  ['barco', 'barco', 'barcos', 'm'],
  ['trem', 'trem', 'trens', 'm'],
  ['foguete', 'foguete', 'foguetes', 'm'],
  ['trator', 'trator', 'tratores', 'm'],
  ['ambulancia', 'ambulância', 'ambulâncias', 'f'],
  ['viatura', 'viatura', 'viaturas', 'f'],
  ['caminhao-de-bombeiros', 'caminhão de bombeiros', 'caminhões de bombeiros', 'm'],
  ['helicoptero', 'helicóptero', 'helicópteros', 'm'],
  // Frutas
  ['maca', 'maçã', 'maçãs', 'f'],
  ['banana', 'banana', 'bananas', 'f'],
  ['uva', 'uva', 'uvas', 'f'],
  ['morango', 'morango', 'morangos', 'm'],
  ['laranja', 'laranja', 'laranjas', 'f'],
  ['melancia', 'melancia', 'melancias', 'f'],
  ['abacaxi', 'abacaxi', 'abacaxis', 'm'],
  ['pera', 'pera', 'peras', 'f'],
  ['cereja', 'cereja', 'cerejas', 'f'],
  ['limao', 'limão', 'limões', 'm'],
  ['kiwi', 'kiwi', 'kiwis', 'm'],
  ['manga', 'manga', 'mangas', 'f'],
  ['pessego', 'pêssego', 'pêssegos', 'm'],
  // Espaço
  ['lua', 'lua', 'luas', 'f'],
  ['sol', 'sol', 'sóis', 'm'],
  ['estrela', 'estrela', 'estrelas', 'f'],
  ['planeta', 'planeta', 'planetas', 'm'],
  ['astronauta', 'astronauta', 'astronautas', 'm'],
  ['satelite', 'satélite', 'satélites', 'm'],
  ['et', 'ê tê', 'ê tês', 'm'],
  ['telescopio', 'telescópio', 'telescópios', 'm'],
  ['terra', 'planeta Terra', 'planetas Terra', 'm'],
  ['disco-voador', 'disco voador', 'discos voadores', 'm'],
  // Outras (pares, rimas e palavras)
  ['cenoura', 'cenoura', 'cenouras', 'f'],
  ['flor', 'flor', 'flores', 'f'],
  ['leite', 'leite', 'leites', 'm'],
  ['pao', 'pão', 'pães', 'm'],
  ['mao', 'mão', 'mãos', 'f'],
  ['vela', 'vela', 'velas', 'f'],
  ['janela', 'janela', 'janelas', 'f'],
  ['pipoca', 'pipoca', 'pipocas', 'f'],
  ['mel', 'mel', 'méis', 'm'],
  ['anel', 'anel', 'anéis', 'm'],
  ['anzol', 'anzol', 'anzóis', 'm'],
  ['bola', 'bola', 'bolas', 'f'],
  ['casa', 'casa', 'casas', 'f'],
  ['dado', 'dado', 'dados', 'm'],
  ['mala', 'mala', 'malas', 'f'],
  ['pe', 'pé', 'pés', 'm'],
]

const NOMES = new Map<NomeFigura, NomeFalado>(
  LISTA.map(([figura, nome, plural, genero]) => [figura, { nome, plural, genero }]),
)

/** Nome falado da figura (sem tabela, usa o id com espaços). */
export function nomeFalado(figura: NomeFigura): NomeFalado {
  return NOMES.get(figura) ?? { nome: figura.replaceAll('-', ' '), plural: figura, genero: 'm' }
}

export function temNomeFalado(figura: NomeFigura): boolean {
  return NOMES.has(figura)
}

/** "no gato" / "na maçã" */
export function emArtigo(figura: NomeFigura): string {
  const { nome, genero } = nomeFalado(figura)
  return `${genero === 'm' ? 'no' : 'na'} ${nome}`
}
