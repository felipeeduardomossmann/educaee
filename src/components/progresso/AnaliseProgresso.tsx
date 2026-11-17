import type { User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import type { Aluno } from '../../lib/aluno'
import {
  AVISO_ANALISE,
  consultarRestantesAnalise,
  gerarAnalise,
  MENSAGENS_ERRO_ANALISE,
  montarDadosAnalise,
  personalizarAnalise,
  SECOES_ANALISE,
  type AnaliseSalva,
  type TextoAnalise,
} from '../../lib/analise'
import type { CodigoErroApi, Restantes } from '../../lib/api'
import { formatarDataHora, PERIODOS, type Periodo } from '../../lib/progresso'
import type { Sessao } from '../../lib/sessoes'
import { useOnline } from '../../hooks/useOnline'
import Botao from '../Botao'
import Card from '../Card'

/** O que a tela precisa para gerar análises (sem isto, só mostra a análise salva). */
export interface GeradorAnalise {
  usuario: User
  /** Salva no aluno (Firestore). */
  salvar: (analise: TextoAnalise, periodo: Periodo, rodadas: number) => Promise<void>
}

interface AnaliseProgressoProps {
  aluno: Aluno
  periodo: Periodo
  /** Rodadas do período escolhido. */
  noPeriodo: readonly Sessao[]
  /** A análise mostrada (a recém-gerada ou a salva no aluno). */
  analise: AnaliseSalva | null
  aoGerar: (analise: AnaliseSalva) => void
  gerador?: GeradorAnalise
}

const rotuloDe = (periodo: Periodo) => PERIODOS.find((p) => p.valor === periodo)?.rotulo ?? ''

export default function AnaliseProgresso({
  aluno,
  periodo,
  noPeriodo,
  analise,
  aoGerar,
  gerador,
}: AnaliseProgressoProps) {
  const online = useOnline()
  const [restantes, setRestantes] = useState<Restantes | null>(null)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<CodigoErroApi | null>(null)
  const [erroSalvar, setErroSalvar] = useState(false)
  const usuario = gerador?.usuario

  useEffect(() => {
    if (!usuario || !online) return
    let ativo = true
    void consultarRestantesAnalise(usuario).then((valor) => {
      if (ativo && valor) setRestantes(valor)
    })
    return () => {
      ativo = false
    }
  }, [usuario, online])

  const semSaldo = restantes?.restamHoje === 0
  const podeGerar = !!gerador && online && !gerando && !semSaldo && noPeriodo.length > 0

  const gerar = async () => {
    if (!gerador || !podeGerar) return
    setGerando(true)
    setErro(null)
    setErroSalvar(false)
    const dados = montarDadosAnalise(aluno.niveis, noPeriodo, periodo)
    const resultado = await gerarAnalise(gerador.usuario, dados)
    if (resultado.restantes) setRestantes(resultado.restantes)
    if (resultado.ok) {
      aoGerar({ ...resultado.analise, periodo, rodadas: noPeriodo.length, geradaEm: new Date() })
      gerador.salvar(resultado.analise, periodo, noPeriodo.length).catch((falha: unknown) => {
        console.warn('Não foi possível salvar a análise', falha)
        setErroSalvar(true)
      })
    } else {
      setErro(resultado.codigo)
    }
    setGerando(false)
  }

  const texto = analise ? personalizarAnalise(analise, aluno.nome) : null
  const outroPeriodo = analise !== null && analise.periodo !== periodo

  return (
    <Card className="flex flex-col gap-4 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titulo-analise" className="text-2xl font-extrabold">
            Análise com IA
          </h2>
          {analise ? (
            <p className="text-sm text-tinta-suave">
              {rotuloDe(analise.periodo)} · {analise.rodadas}{' '}
              {analise.rodadas === 1 ? 'rodada' : 'rodadas'} · gerada em{' '}
              {formatarDataHora(analise.geradaEm)}
            </p>
          ) : (
            <p className="text-tinta-suave">
              Um resumo em texto do período escolhido, para professores e famílias. Só os números
              das rodadas são enviados, sem o nome do aluno.
            </p>
          )}
        </div>
        {gerador && (
          <div className="flex flex-col items-end gap-1">
            <Botao onClick={() => void gerar()} disabled={!podeGerar}>
              {gerando ? 'Analisando…' : analise ? 'Gerar nova análise' : 'Gerar análise'}
            </Botao>
            <p className="text-sm text-tinta-suave">
              {!online
                ? 'Sem internet.'
                : noPeriodo.length === 0
                  ? 'Sem rodadas neste período.'
                  : restantes
                    ? restantes.restamHoje === 0
                      ? MENSAGENS_ERRO_ANALISE[
                          restantes.limitadoPeloMes ? 'limite-mes' : 'limite-dia'
                        ]
                      : `${restantes.restamHoje === 1 ? 'Resta 1 análise' : `Restam ${restantes.restamHoje} análises`} hoje.`
                    : ''}
            </p>
          </div>
        )}
      </div>

      <p role="status" className="sr-only">
        {gerando ? 'Gerando a análise.' : ''}
      </p>
      {erro && (
        <p role="alert" className="rounded-2xl bg-rosa px-4 py-3 font-semibold">
          {MENSAGENS_ERRO_ANALISE[erro]}
        </p>
      )}
      {erroSalvar && (
        <p role="alert" className="rounded-2xl bg-sol px-4 py-3 font-semibold">
          A análise foi gerada, mas não foi possível salvá-la. Ela vale só até sair desta tela.
        </p>
      )}
      {outroPeriodo && (
        <p className="rounded-2xl bg-sol px-4 py-3">
          Esta análise é de “{rotuloDe(analise.periodo).toLowerCase()}”. Para “
          {rotuloDe(periodo).toLowerCase()}”, gere uma nova. Só a análise do período escolhido entra
          no PDF.
        </p>
      )}

      {texto && (
        <div className="flex flex-col gap-4 text-lg">
          {texto.visaoGeral.map((paragrafo, i) => (
            <p key={i}>{paragrafo}</p>
          ))}
          {SECOES_ANALISE.map(([titulo, campo]) => [titulo, texto[campo]] as const).map(
            ([titulo, itens]) =>
              itens.length > 0 && (
                <section key={titulo} className="flex flex-col gap-2">
                  <h3 className="text-lg font-extrabold">{titulo}</h3>
                  <ul className="flex list-disc flex-col gap-1 pl-6 marker:text-coral">
                    {itens.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              ),
          )}
          <p className="rounded-2xl bg-creme px-4 py-3 text-sm text-tinta-suave">{AVISO_ANALISE}</p>
        </div>
      )}
    </Card>
  )
}
