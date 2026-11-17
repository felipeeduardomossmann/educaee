import { useEffect, useState, type ReactNode } from 'react'
import { useAparencia } from '../../atividades/aparencia'
import { formatarDuracao } from '../../lib/cronometro'
import type { Perfil } from '../../lib/perfil'
import type { ResultadoRodada } from '../../lib/sessoes'
import { falar, pararFala } from '../../lib/voz'
import Botao from '../Botao'
import Mascote from '../Mascote'
import { MENSAGENS_RESULTADO } from '../../lib/mensagens'

/** Situação da gravação da rodada (só com login). */
export type Salvamento = 'sem-conta' | 'salvando' | 'salva' | 'pendente' | 'erro'

const MENSAGENS = MENSAGENS_RESULTADO

const TEXTO_SALVAMENTO: Record<Salvamento, string | null> = {
  'sem-conta': 'Modo convidado: esta rodada não foi salva.',
  salvando: 'Salvando…',
  salva: 'Rodada salva.',
  pendente: 'Sem internet: a rodada fica guardada e será enviada quando a conexão voltar.',
  erro: 'Não foi possível salvar esta rodada.',
}

interface TelaResultadoProps {
  resultado: ResultadoRodada
  perfil: Perfil
  salvamento: Salvamento
  aoJogarDeNovo: () => void
  aoEscolherOutra: () => void
  /** Etapa da trilha do dia: o botão principal segue a trilha. */
  naTrilha?: boolean
  /** Espaço para a sugestão de nível (etapa 7). */
  sugestao?: ReactNode
}

export default function TelaResultado({
  resultado,
  perfil,
  salvamento,
  aoJogarDeNovo,
  aoEscolherOutra,
  naTrilha = false,
  sugestao,
}: TelaResultadoProps) {
  const aparencia = useAparencia(perfil)
  // Sorteada uma vez por rodada: a mensagem é sempre positiva, mesmo com muitos erros.
  const [mensagem] = useState(() => MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)] ?? '')

  useEffect(() => {
    if (perfil.leituraVoz) void falar(mensagem, perfil.velocidadeVoz)
    return pararFala
  }, [mensagem, perfil.leituraVoz, perfil.velocidadeVoz])

  const numeros = [
    { rotulo: 'Acertos', valor: String(resultado.acertos) },
    { rotulo: 'Erros', valor: String(resultado.erros) },
    { rotulo: 'Tempo', valor: formatarDuracao(resultado.duracaoSeg) },
  ]

  return (
    <main
      className={`flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10 text-center ${aparencia.classeTela}`}
    >
      <Mascote className="size-32 sm:size-40" />
      <h1 className="text-4xl font-extrabold sm:text-5xl">{mensagem}</h1>

      <dl className="grid w-full max-w-xl grid-cols-3 gap-3">
        {numeros.map(({ rotulo, valor }) => (
          <div key={rotulo} className={`flex flex-col-reverse gap-1 p-4 ${aparencia.classeAlvo}`}>
            <dt className="text-lg font-semibold">{rotulo}</dt>
            <dd className="text-3xl font-extrabold">{valor}</dd>
          </div>
        ))}
      </dl>

      {sugestao}

      <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
        {naTrilha ? (
          <>
            <Botao tamanho="grande" className="flex-1" onClick={aoEscolherOutra} autoFocus>
              Continuar a trilha
            </Botao>
            <Botao
              variante="secundario"
              tamanho="grande"
              className="flex-1"
              onClick={aoJogarDeNovo}
            >
              Jogar de novo
            </Botao>
          </>
        ) : (
          <>
            <Botao tamanho="grande" className="flex-1" onClick={aoJogarDeNovo} autoFocus>
              Jogar de novo
            </Botao>
            <Botao
              variante="secundario"
              tamanho="grande"
              className="flex-1"
              onClick={aoEscolherOutra}
            >
              Escolher outra atividade
            </Botao>
          </>
        )}
      </div>

      <p role="status" className="min-h-6 font-semibold opacity-80">
        {TEXTO_SALVAMENTO[salvamento]}
      </p>
    </main>
  )
}
