/** Gerador de números entre 0 e 1. Injetável para os testes serem previsíveis. */
export type Aleatorio = () => number

/** Cópia embaralhada (Fisher–Yates). */
export function embaralhar<T>(itens: readonly T[], aleatorio: Aleatorio = Math.random): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j] as T, copia[i] as T]
  }
  return copia
}

/** Sorteia `quantidade` itens diferentes. */
export function sortear<T>(
  itens: readonly T[],
  quantidade: number,
  aleatorio: Aleatorio = Math.random,
): T[] {
  if (quantidade > itens.length) {
    throw new Error(`Não dá para sortear ${quantidade} de ${itens.length} itens`)
  }
  return embaralhar(itens, aleatorio).slice(0, quantidade)
}
