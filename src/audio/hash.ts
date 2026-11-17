// Id de cada fala gravada: hash do texto (o mesmo no navegador e no script de geração).
// Mudou o texto, muda o id, e o script grava um áudio novo.

/** Junta espaços, para pequenas diferenças de digitação não criarem outro áudio. */
export function normalizarFala(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/** cyrb53: hash de 53 bits, rápido e estável (sem dependências). */
function cyrb53(texto: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function idFala(texto: string): string {
  return cyrb53(normalizarFala(texto)).toString(36)
}
