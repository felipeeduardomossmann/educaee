import { useEffect, useState } from 'react'
import { JOGADAS_POR_RODADA, type PropsAtividade } from '../tipos'
import { useAparencia } from '../aparencia'

/** Só em desenvolvimento: atividade falsa para testar o motor. */
export default function AtividadeSimulada({
  perfil,
  nivel,
  pausado,
  instruir,
  acertou,
  errou,
  concluir,
}: PropsAtividade) {
  const [jogada, setJogada] = useState(1)
  const { areaToque, classeAlvo } = useAparencia(perfil)

  useEffect(() => {
    instruir(`Jogada ${jogada} de ${JOGADAS_POR_RODADA}. Nível ${nivel}.`)
  }, [jogada, nivel, instruir])

  const acertar = () => {
    acertou()
    if (jogada >= JOGADAS_POR_RODADA) concluir()
    else setJogada(jogada + 1)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-lg opacity-80">Atividade simulada (só no modo de desenvolvimento)</p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          disabled={pausado}
          onClick={acertar}
          style={{ minWidth: areaToque * 2, minHeight: areaToque }}
          className={`px-6 text-2xl font-extrabold ${classeAlvo}`}
        >
          Acertar
        </button>
        <button
          type="button"
          disabled={pausado}
          onClick={errou}
          style={{ minWidth: areaToque * 2, minHeight: areaToque }}
          className={`px-6 text-2xl font-extrabold ${classeAlvo}`}
        >
          Errar
        </button>
      </div>
    </div>
  )
}
