import { idFala } from './hash'

// Áudios gravados (MP3) de cada fala, em src/assets/falas/<id>.mp3. Só as URLs entram no
// código; cada áudio é baixado quando toca (e fica no cache offline do service worker).
const urls = import.meta.glob<string>('../assets/falas/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

const porId = new Map(
  Object.entries(urls).map(([caminho, url]) => [caminho.replace(/^.*\/|\.mp3$/g, ''), url]),
)

/** URL do áudio gravado desta fala, ou null se ainda não houver (aí vale a voz do navegador). */
export function urlDaFala(texto: string): string | null {
  return porId.get(idFala(texto)) ?? null
}

export function temFalasGravadas(): boolean {
  return porId.size > 0
}
