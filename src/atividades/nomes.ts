import type { NomeFigura } from '../lib/figuras'

/** Nome da figura para leitores de tela ("tiranossauro-rex" → "tiranossauro rex"). */
export function nomeLegivel(figura: NomeFigura): string {
  return figura.replaceAll('-', ' ')
}
