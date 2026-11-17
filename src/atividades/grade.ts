export interface Grade {
  colunas: number
  linhas: number
  /** Lado de cada peça, em px. */
  lado: number
}

interface OpcoesGrade {
  quantidade: number
  largura: number
  altura: number
  espaco: number
  /** Lado mínimo (a área de toque do perfil). Nunca fica abaixo disso. */
  minimo: number
  /** Lado máximo, para as peças não ficarem enormes em telas grandes. */
  maximo: number
}

// Opções até 5% menores que a melhor contam como "do mesmo tamanho".
const TOLERANCIA = 0.95

/** Colunas para `quantidade` peças: maiores possível, sem rolar na horizontal. */
export function calcularGrade({
  quantidade,
  largura,
  altura,
  espaco,
  minimo,
  maximo,
}: OpcoesGrade): Grade {
  const candidatas: (Grade & { vazios: number })[] = []
  for (let colunas = 1; colunas <= quantidade; colunas++) {
    const linhas = Math.ceil(quantidade / colunas)
    const vazios = linhas * colunas - quantidade
    const ladoLargura = (largura - espaco * (colunas - 1)) / colunas
    // Colunas demais para a largura, com o mínimo de toque: rolaria para o lado.
    if (ladoLargura < minimo && colunas > 1) break
    const ladoAltura = (altura - espaco * (linhas - 1)) / linhas
    const lado = Math.floor(Math.max(minimo, Math.min(ladoLargura, ladoAltura, maximo)))
    candidatas.push({ colunas, linhas, lado, vazios })
  }
  const [primeira] = candidatas
  if (!primeira) return { colunas: 1, linhas: quantidade, lado: minimo }

  const maiorLado = Math.max(...candidatas.map((c) => c.lado))
  const escolhida =
    maiorLado === minimo
      ? // Tudo no mínimo (falta altura): mais colunas = menos linhas = menos rolagem.
        candidatas.reduce((a, b) => (b.colunas > a.colunas ? b : a))
      : candidatas
          .filter((c) => c.lado >= maiorLado * TOLERANCIA)
          .sort((a, b) => a.vazios - b.vazios || b.lado - a.lado)[0]
  const { colunas, linhas, lado } = escolhida ?? primeira
  return { colunas, linhas, lado }
}
