import { useState } from 'react'
import { ATIVIDADES, buscarAtividade } from '../../atividades/registro'
import type { Aluno } from '../../lib/aluno'
import { personalizarAnalise, type AnaliseSalva } from '../../lib/analise'
import { formatarDuracao } from '../../lib/cronometro'
import {
  filtrarPeriodo,
  formatarData,
  formatarDataHora,
  formatarPorcentagem,
  PERIODOS,
  resumir,
  serieGrafico,
  type Periodo,
} from '../../lib/progresso'
import type { Sessao } from '../../lib/sessoes'
import Botao from '../Botao'
import BotaoLink from '../BotaoLink'
import Card from '../Card'
import Figura from '../Figura'
import AnaliseProgresso, { type GeradorAnalise } from './AnaliseProgresso'
import GraficoTaxa from './GraficoTaxa'

interface RelatorioProgressoProps {
  aluno: Aluno
  /** Rodadas do aluno, da mais nova para a mais antiga. */
  sessoes: readonly Sessao[]
  carregando: boolean
  erro: boolean
  /** Para gerar análises com IA (só com login). Sem isto, mostra só a análise salva. */
  gerador?: GeradorAnalise
}

/** Relatório de progresso de um aluno (tela e impressão). Só exibe: os dados vêm de fora. */
export default function RelatorioProgresso({
  aluno,
  sessoes,
  carregando,
  erro,
  gerador,
}: RelatorioProgressoProps) {
  const [periodo, setPeriodo] = useState<Periodo>('30')
  // A recém-gerada aparece na hora, mesmo antes (ou sem) a confirmação do banco.
  const [analiseNova, setAnaliseNova] = useState<AnaliseSalva | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [erroPdf, setErroPdf] = useState(false)
  const noPeriodo = filtrarPeriodo(sessoes, periodo)
  const ultima = sessoes[0]
  const rotuloPeriodo = PERIODOS.find((p) => p.valor === periodo)?.rotulo ?? ''
  const analise = analiseNova ?? aluno.analise ?? null

  const baixarPdf = async () => {
    setGerandoPdf(true)
    setErroPdf(false)
    try {
      // A biblioteca de PDF (e a fonte) só carrega agora, no clique.
      const { baixarRelatorioPdf } = await import('../../lib/relatorio-pdf')
      await baixarRelatorioPdf({
        aluno,
        rotuloPeriodo,
        sessoes: noPeriodo,
        analise:
          analise && analise.periodo === periodo ? personalizarAnalise(analise, aluno.nome) : null,
      })
    } catch (falha) {
      console.error(falha)
      setErroPdf(true)
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho que só aparece no papel/PDF. */}
      <p className="hidden text-lg font-bold print:block">
        EducAEE – Relatório de progresso – {aluno.nome} – {formatarData(new Date())}
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">{aluno.nome}</h1>
          <p className="text-lg text-tinta-suave">{aluno.turma || 'Sem turma'}</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <BotaoLink to={`/aluno/${aluno.id}/atividades`} variante="secundario">
            Atividades
          </BotaoLink>
          <Botao onClick={() => void baixarPdf()} disabled={sessoes.length === 0 || gerandoPdf}>
            {gerandoPdf ? 'Gerando PDF…' : 'Baixar relatório (PDF)'}
          </Botao>
        </div>
      </header>

      {erroPdf && (
        <p role="alert" className="rounded-2xl bg-rosa px-5 py-4 text-lg font-semibold">
          Não foi possível gerar o PDF. Tente de novo.
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col-reverse gap-1 p-5">
          <dt className="text-tinta-suave">Total de rodadas</dt>
          <dd className="text-3xl font-extrabold">{sessoes.length}</dd>
        </Card>
        <Card className="flex flex-col-reverse gap-1 p-5">
          <dt className="text-tinta-suave">Última atividade</dt>
          <dd className="text-xl font-extrabold">
            {ultima
              ? `${buscarAtividade(ultima.atividadeId)?.nome ?? ''} · ${formatarData(ultima.concluidaEm)}`
              : '—'}
          </dd>
        </Card>
      </dl>

      {carregando ? (
        <p role="status" className="text-lg text-tinta-suave">
          Carregando rodadas…
        </p>
      ) : erro ? (
        <p role="alert" className="rounded-2xl bg-rosa px-5 py-4 text-lg font-semibold">
          Não foi possível carregar as rodadas. Verifique a internet e recarregue a página.
        </p>
      ) : sessoes.length === 0 ? (
        <Card cor="sol">
          <p className="text-lg">
            Ainda não há rodadas. Quando {aluno.nome} jogar, o progresso aparece aqui.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Período" className="flex flex-wrap gap-2 print:hidden">
              {PERIODOS.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  aria-pressed={periodo === opcao.valor}
                  onClick={() => setPeriodo(opcao.valor)}
                  className={`min-h-11 rounded-full border-2 px-4 font-bold ${
                    periodo === opcao.valor
                      ? 'border-azul bg-azul text-sobre-cor'
                      : 'border-borda bg-white text-tinta hover:border-azul'
                  }`}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
            <p className="hidden font-bold print:block">Período: {rotuloPeriodo}</p>
          </div>

          <section aria-labelledby="titulo-analise">
            <AnaliseProgresso
              aluno={aluno}
              periodo={periodo}
              noPeriodo={noPeriodo}
              analise={analise}
              aoGerar={setAnaliseNova}
              gerador={gerador}
            />
          </section>

          <section aria-labelledby="titulo-atividades" className="flex flex-col gap-4">
            <h2 id="titulo-atividades" className="text-2xl font-extrabold">
              Por atividade
            </h2>
            <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-1">
              {ATIVIDADES.map((atividade) => {
                const daAtividade = noPeriodo.filter((s) => s.atividadeId === atividade.id)
                const resumo = resumir(daAtividade)
                return (
                  <Card key={atividade.id} className="flex flex-col gap-4 print:break-inside-avoid">
                    <div className="flex items-center gap-3">
                      <Figura nome={atividade.icone} alt="" className="size-10" />
                      <h3 className="text-xl font-extrabold">{atividade.nome}</h3>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { rotulo: 'Nível atual', valor: String(aluno.niveis[atividade.id]) },
                        { rotulo: 'Rodadas', valor: String(resumo.rodadas) },
                        {
                          rotulo: 'Acerto médio',
                          valor:
                            resumo.taxaMedia === null ? '—' : formatarPorcentagem(resumo.taxaMedia),
                        },
                      ].map(({ rotulo, valor }) => (
                        <div
                          key={rotulo}
                          className="flex flex-col-reverse rounded-2xl bg-creme p-2"
                        >
                          <dt className="text-sm text-tinta-suave">{rotulo}</dt>
                          <dd className="text-2xl font-extrabold">{valor}</dd>
                        </div>
                      ))}
                    </dl>
                    {daAtividade.length > 0 ? (
                      <GraficoTaxa pontos={serieGrafico(daAtividade)} titulo={atividade.nome} />
                    ) : (
                      <p className="text-tinta-suave">Nenhuma rodada neste período.</p>
                    )}
                    {atividade.id === 'memoria' && daAtividade.length > 0 && (
                      <p className="text-sm text-tinta-suave">
                        Na memória, errar faz parte de descobrir onde estão as cartas.
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="titulo-historico" className="flex flex-col gap-4">
            <h2 id="titulo-historico" className="text-2xl font-extrabold">
              Histórico
            </h2>
            {noPeriodo.length === 0 ? (
              <p className="text-tinta-suave">Nenhuma rodada neste período.</p>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-borda bg-white shadow-suave print:overflow-visible print:shadow-none">
                <table className="w-full min-w-[40rem] text-left">
                  <caption className="sr-only">
                    Rodadas de {aluno.nome}: {rotuloPeriodo.toLowerCase()}
                  </caption>
                  <thead className="bg-creme text-sm text-tinta-suave">
                    <tr>
                      {['Data', 'Atividade', 'Nível', 'Acertos', 'Erros', 'Duração'].map(
                        (coluna) => (
                          <th key={coluna} scope="col" className="px-4 py-3 font-bold">
                            {coluna}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {noPeriodo.map((sessao) => (
                      <tr
                        key={sessao.id}
                        className="border-t border-borda print:break-inside-avoid"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatarDataHora(sessao.concluidaEm)}
                        </td>
                        <td className="px-4 py-3">{buscarAtividade(sessao.atividadeId)?.nome}</td>
                        <td className="px-4 py-3">{sessao.nivel}</td>
                        <td className="px-4 py-3">{sessao.acertos}</td>
                        <td className="px-4 py-3">{sessao.erros}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatarDuracao(sessao.duracaoSeg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
