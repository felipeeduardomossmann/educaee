import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatarDataHora, type PontoGrafico } from '../../lib/progresso'
import { useTema } from '../../lib/tema'

// Cores do tema (texto em tinta, nunca na cor da série).
// Os mesmos valores de src/index.css (azul, borda, tinta-suave e branco/superfície).
const CORES = {
  claro: { serie: '#2b6cb0', grade: '#e8dfd2', eixo: '#4a5868', fundo: '#ffffff' },
  escuro: { serie: '#7fb3ea', grade: '#364253', eixo: '#adb9c6', fundo: '#1c2531' },
}

/** Só o que a dica usa do que o Recharts entrega. */
interface PropsDica {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
}

function Dica({ active, payload }: PropsDica) {
  const ponto = payload?.[0]?.payload as PontoGrafico | undefined
  if (!active || !ponto) return null
  return (
    <div className="rounded-xl border border-borda bg-white px-3 py-2 text-sm shadow-suave">
      <p className="font-bold">
        Rodada {ponto.rodada} · {ponto.taxa}% de acerto
      </p>
      <p className="text-tinta-suave">
        Nível {ponto.nivel} · {formatarDataHora(ponto.data)}
      </p>
    </div>
  )
}

/** Taxa de acerto por rodada (a tabela de histórico tem os mesmos dados em texto). */
export default function GraficoTaxa({
  pontos,
  titulo,
}: {
  pontos: PontoGrafico[]
  titulo: string
}) {
  const cor = CORES[useTema()]
  return (
    <figure className="w-full max-w-[600px] print:max-w-[560px]">
      <figcaption className="sr-only">
        {titulo}: taxa de acerto em cada rodada, da mais antiga para a mais recente.
      </figcaption>
      <div className="h-44 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={pontos}
            margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
            // O gráfico é só visual (aria-hidden); a tabela é a versão acessível. Sem isto, o
            // Recharts deixa o gráfico focável e o Tab pararia num elemento "invisível".
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} stroke={cor.grade} />
            <XAxis
              dataKey="rodada"
              tick={{ fill: cor.eixo, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: cor.grade }}
              allowDecimals={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(valor: number) => `${valor}%`}
              tick={{ fill: cor.eixo, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={Dica} cursor={{ stroke: cor.eixo, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="taxa"
              stroke={cor.serie}
              strokeWidth={2}
              dot={{ r: 4, fill: cor.serie, stroke: cor.fundo, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: cor.fundo, strokeWidth: 2 }}
              // Sem animação: calmo, e o gráfico já sai pronto na impressão.
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
