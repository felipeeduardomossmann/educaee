// Baixa do Fluent Emoji Flat (MIT) só as figuras usadas, em src/assets/figuras/.
// Uso: node scripts/baixar-figuras.mjs

import { mkdir, writeFile } from 'node:fs/promises'

const VERSAO = '1.2.6'
const URL_PACOTE = `https://cdn.jsdelivr.net/npm/@iconify-json/fluent-emoji-flat@${VERSAO}/icons.json`
const DESTINO = new URL('../src/assets/figuras/', import.meta.url)

const FIGURAS = {
  // Animais
  cachorro: 'dog-face',
  gato: 'cat-face',
  peixe: 'tropical-fish',
  passaro: 'bird',
  coelho: 'rabbit-face',
  vaca: 'cow-face',
  porco: 'pig-face',
  leao: 'lion',
  macaco: 'monkey-face',
  tartaruga: 'turtle',
  sapo: 'frog',
  abelha: 'honeybee',
  // Dinossauros
  dinossauro: 'sauropod',
  'tiranossauro-rex': 't-rex',
  ovo: 'egg',
  vulcao: 'volcano',
  pegada: 'paw-prints',
  folha: 'leaf-fluttering-in-wind',
  osso: 'bone',
  palmeira: 'palm-tree',
  pedra: 'rock',
  lagarto: 'lizard',
  crocodilo: 'crocodile',
  samambaia: 'herb',
  // Veículos
  carro: 'automobile',
  onibus: 'bus',
  caminhao: 'delivery-truck',
  moto: 'motorcycle',
  bicicleta: 'bicycle',
  aviao: 'airplane',
  barco: 'sailboat',
  trem: 'locomotive',
  foguete: 'rocket',
  trator: 'tractor',
  ambulancia: 'ambulance',
  viatura: 'police-car',
  'caminhao-de-bombeiros': 'fire-engine',
  helicoptero: 'helicopter',
  // Frutas
  maca: 'red-apple',
  banana: 'banana',
  uva: 'grapes',
  morango: 'strawberry',
  laranja: 'tangerine',
  melancia: 'watermelon',
  abacaxi: 'pineapple',
  pera: 'pear',
  cereja: 'cherries',
  limao: 'lemon',
  kiwi: 'kiwi-fruit',
  manga: 'mango',
  pessego: 'peach',
  // Espaço
  lua: 'crescent-moon',
  sol: 'sun',
  estrela: 'star',
  planeta: 'ringed-planet',
  astronauta: 'astronaut',
  cometa: 'comet',
  satelite: 'satellite',
  et: 'alien',
  telescopio: 'telescope',
  terra: 'globe-showing-americas',
  'disco-voador': 'flying-saucer',
  // Palavras da atividade Letras (as demais já estão acima)
  bola: 'soccer-ball',
  pato: 'duck',
  casa: 'house',
  dado: 'game-die',
  mala: 'luggage',
  foca: 'seal',
  pe: 'foot',
  // Interface
  'alto-falante': 'speaker-high-volume',
  pausar: 'pause-button',
  continuar: 'play-button',
  porta: 'door',
  engrenagem: 'gear',
  brilho: 'sparkles',
  'estrela-brilhante': 'glowing-star',
  'quebra-cabeca': 'puzzle-piece',
  grafico: 'chart-increasing',
  'giz-de-cera': 'crayon',
  cadeado: 'locked',
  impressora: 'printer',
  baixar: 'inbox-tray',
  televisao: 'television',
  notebook: 'laptop',
  'dedo-tocando': 'backhand-index-pointing-up',
  proibido: 'prohibited',
  joinha: 'thumbs-up',
  livros: 'books',
  // Emoções
  'rosto-feliz': 'grinning-face-with-big-eyes',
  'rosto-triste': 'crying-face',
  'rosto-bravo': 'angry-face',
  'rosto-com-medo': 'fearful-face',
  'rosto-surpreso': 'astonished-face',
  // Pares que combinam, rimas e montar palavras
  cenoura: 'carrot',
  flor: 'blossom',
  leite: 'glass-of-milk',
  rato: 'mouse-face',
  pao: 'bread',
  mao: 'raised-hand',
  vela: 'candle',
  janela: 'window',
  pipoca: 'popcorn',
  mel: 'honey-pot',
  anel: 'ring',
  anzol: 'fishing-pole',
  // Rotina e sequências do dia a dia
  despertador: 'alarm-clock',
  'escova-de-dentes': 'toothbrush',
  cama: 'bed',
  pintinho: 'hatching-chick',
  galinha: 'chicken',
  broto: 'seedling',
  planta: 'potted-plant',
  girassol: 'sunflower',
  nuvem: 'cloud',
  chuva: 'cloud-with-rain',
  'arco-iris': 'rainbow',
  banheira: 'bathtub',
  prato: 'fork-and-knife-with-plate',
  sabonete: 'soap',
  // Ícones das atividades novas
  numeros: 'input-numbers',
  caminho: 'curly-loop',
  elo: 'link',
  ampulheta: 'hourglass-not-done',
  silhueta: 'bust-in-silhouette',
  interrogacao: 'red-question-mark',
  orelha: 'ear',
  'bloco-de-notas': 'memo',
  calendario: 'spiral-calendar',
  // Prancha de comunicação (CAA)
  'eu-quero': 'person-raising-hand',
  'eu-sinto': 'red-heart',
  agua: 'cup-with-straw',
  banheiro: 'toilet',
  brincar: 'teddy-bear',
  descansar: 'couch-and-lamp',
  abraco: 'people-hugging',
  'com-dor': 'face-with-head-bandage',
  cansado: 'tired-face',
  sim: 'check-mark-button',
  nao: 'cross-mark',
  'nao-sei': 'person-shrugging',
  'de-novo': 'repeat-button',
  acabou: 'chequered-flag',
  professora: 'woman-teacher',
  mae: 'woman',
  pai: 'man',
  colega: 'child',
  escola: 'school',
  parque: 'national-park',
  prancha: 'speech-balloon',
  // Ícones das atividades
  cartas: 'flower-playing-cards',
  lupa: 'magnifying-glass-tilted-left',
  alvo: 'bullseye',
  abc: 'input-latin-uppercase',
}

const resposta = await fetch(URL_PACOTE)
if (!resposta.ok) throw new Error(`Falha ao baixar ${URL_PACOTE}: ${resposta.status}`)
const pacote = await resposta.json()

await mkdir(DESTINO, { recursive: true })

for (const [nome, nomeFluent] of Object.entries(FIGURAS)) {
  const icone = pacote.icons[nomeFluent]
  if (!icone) throw new Error(`Figura não encontrada no Fluent Emoji Flat: ${nomeFluent}`)
  const largura = icone.width ?? pacote.width
  const altura = icone.height ?? pacote.height
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icone.left ?? 0} ${icone.top ?? 0} ${largura} ${altura}">${icone.body}</svg>\n`
  await writeFile(new URL(`${nome}.svg`, DESTINO), svg)
}

const nomes = Object.keys(FIGURAS)
  .sort()
  .map((nome) => `  '${nome}',`)
  .join('\n')
await writeFile(
  new URL('../src/lib/nomes-figuras.ts', import.meta.url),
  `// Gerado por scripts/baixar-figuras.mjs. Não edite à mão.\nexport const NOMES_FIGURAS = [\n${nomes}\n] as const\n`,
)

console.log(`${Object.keys(FIGURAS).length} figuras salvas em src/assets/figuras/`)
