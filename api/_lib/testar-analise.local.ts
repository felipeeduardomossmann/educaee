// Teste manual da análise com 3 cenários fictícios (fora do build).
// Uso: npx rolldown api/_lib/testar-analise.local.ts -o saida.mjs --platform node
//      node --env-file=.env.local saida.mjs [modelo]
import {
  corpoPedidoAnalise,
  descreverDados,
  extrairTexto,
  lerAnalise,
  removerContradicoes,
  validarDados,
} from './analise.js'
import { chamarGemini } from './gemini.js'

const dia = (n: number) => {
  const d = new Date(Date.UTC(2026, 9, 3 + n))
  return d.toISOString().slice(0, 10)
}
const rodadas = (inicio: number, passo: number, lista: [number, number][]) =>
  lista.map(([nivel, taxa], i) => ({ data: dia(inicio + i * passo), nivel, taxa }))
const atividade = (
  atividade: string,
  nivelAtual: number,
  lista: { data: string; nivel: number; taxa: number }[],
) => ({
  atividade,
  nivelAtual,
  totalRodadas: lista.length,
  rodadas: lista,
})

const CENARIOS = {
  'Aluno evoluindo': {
    periodo: '30',
    atividades: [
      atividade(
        'igual',
        3,
        rodadas(0, 3, [
          [1, 70],
          [1, 85],
          [1, 95],
          [2, 75],
          [2, 85],
          [2, 92],
          [3, 70],
          [3, 80],
          [3, 88],
          [3, 90],
        ]),
      ),
      atividade(
        'memoria',
        2,
        rodadas(1, 3, [
          [1, 50],
          [1, 55],
          [1, 65],
          [2, 45],
          [2, 55],
          [2, 60],
          [2, 68],
          [2, 70],
        ]),
      ),
      atividade(
        'letras',
        2,
        rodadas(2, 4, [
          [1, 60],
          [1, 75],
          [1, 90],
          [2, 70],
          [2, 80],
          [2, 85],
        ]),
      ),
      atividade(
        'alvo',
        2,
        rodadas(4, 5, [
          [2, 88],
          [2, 92],
          [2, 95],
          [2, 93],
          [2, 96],
        ]),
      ),
      atividade(
        'contar',
        1,
        rodadas(6, 6, [
          [1, 60],
          [1, 70],
          [1, 80],
          [1, 85],
        ]),
      ),
    ],
  },
  'Dificuldade em alfabetização': {
    periodo: '30',
    atividades: [
      atividade(
        'letras',
        2,
        rodadas(0, 3, [
          [2, 40],
          [2, 55],
          [2, 35],
          [2, 50],
          [2, 45],
          [2, 30],
          [2, 50],
          [2, 40],
        ]),
      ),
      atividade(
        'sons',
        1,
        rodadas(2, 6, [
          [1, 40],
          [1, 50],
          [1, 45],
        ]),
      ),
      atividade(
        'igual',
        2,
        rodadas(1, 4, [
          [2, 92],
          [2, 95],
          [2, 100],
          [2, 96],
          [2, 100],
          [2, 98],
        ]),
      ),
      atividade(
        'alvo',
        3,
        rodadas(3, 5, [
          [3, 90],
          [3, 95],
          [3, 93],
          [3, 97],
          [3, 95],
        ]),
      ),
      atividade(
        'sequencia',
        2,
        rodadas(5, 6, [
          [2, 80],
          [2, 85],
          [2, 88],
          [2, 90],
        ]),
      ),
    ],
  },
  'Poucos dados': {
    periodo: '7',
    atividades: [
      atividade('igual', 1, rodadas(0, 1, [[1, 80]])),
      atividade('memoria', 1, rodadas(1, 1, [[1, 60]])),
    ],
  },
}

const modelo = process.argv[2]
for (const [nome, bruto] of Object.entries(CENARIOS)) {
  const dados = validarDados(bruto)
  if (!dados) throw new Error(`cenário inválido: ${nome}`)
  if (process.argv.includes('--dados')) console.log(descreverDados(dados))
  const inicio = Date.now()
  const resposta = await chamarGemini(corpoPedidoAnalise(dados, modelo))
  const lida = resposta.tipo === 'ok' ? lerAnalise(extrairTexto(resposta.dados)) : null
  const analise = lida && removerContradicoes(lida, dados)
  if (lida && analise && lida.fortes.length !== analise.fortes.length) {
    console.log(
      '(rede de segurança tirou pontos fortes:',
      lida.fortes.filter((f) => !analise.fortes.includes(f)),
      ')',
    )
  }
  const uso = resposta.tipo === 'ok' ? (resposta.dados as { usage?: unknown }).usage : null
  console.log(`\n===== ${nome} (${((Date.now() - inicio) / 1000).toFixed(1)} s) =====`)
  console.log(JSON.stringify(uso))
  console.log(analise ? JSON.stringify(analise, null, 2) : `FALHOU: ${resposta.tipo}`)
}
