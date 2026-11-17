import type { Aparencia } from '../../atividades/aparencia'
import type { Sugestao } from '../../lib/sugestao'
import Botao from '../Botao'

export type RespostaSugestao = 'pergunta' | 'aceita' | 'mantida'

interface SugestaoNivelProps {
  sugestao: Sugestao
  resposta: RespostaSugestao
  /** Nome do aluno; null no modo convidado. */
  nome: string | null
  nivelAtual: number
  aparencia: Aparencia
  aoAceitar: () => void
  aoManter: () => void
}

/** Sugestão de subir ou descer de nível. Nunca muda sozinha: a professora decide. */
export default function SugestaoNivel({
  sugestao,
  resposta,
  nome,
  nivelAtual,
  aparencia,
  aoAceitar,
  aoManter,
}: SugestaoNivelProps) {
  const para = nome ? ` para ${nome}` : ''
  const subir = sugestao.tipo === 'subir'
  const pergunta = subir
    ? `Parece fácil${para}. Subir para o nível ${sugestao.nivelNovo}?`
    : `Parece difícil${para}. Voltar para o nível ${sugestao.nivelNovo}?`

  return (
    <section
      aria-live="polite"
      aria-label="Sugestão de nível"
      className={`flex w-full max-w-2xl flex-col items-center gap-4 rounded-3xl p-5 ${
        aparencia.altoContraste
          ? 'border-4 border-ac-contorno bg-ac-fundo text-ac-texto'
          : 'border-2 border-azul/30 bg-ceu text-tinta'
      }`}
    >
      {resposta === 'pergunta' ? (
        <>
          <p className="text-xl font-extrabold sm:text-2xl">{pergunta}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Botao tamanho="grande" onClick={aoAceitar}>
              {subir ? 'Subir' : 'Voltar'}
            </Botao>
            <Botao variante="secundario" tamanho="grande" onClick={aoManter}>
              Manter
            </Botao>
          </div>
        </>
      ) : (
        <p className="text-xl font-extrabold">
          {resposta === 'aceita'
            ? `Pronto! Agora é o nível ${sugestao.nivelNovo}.`
            : `Tudo bem, continua no nível ${nivelAtual}.`}
        </p>
      )}
    </section>
  )
}
