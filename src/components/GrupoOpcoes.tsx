import { useId } from 'react'
import type { NomeFigura } from '../lib/figuras'
import Figura from './Figura'

export interface Opcao<T> {
  valor: T
  rotulo: string
  figura?: NomeFigura
}

interface GrupoOpcoesProps<T extends string | boolean> {
  legenda: string
  ajuda?: string
  opcoes: readonly Opcao<T>[]
  valor: T
  aoMudar: (valor: T) => void
  desativado?: boolean
}

/** Escolha única com botões grandes (radio buttons nativos por baixo). */
export default function GrupoOpcoes<T extends string | boolean>({
  legenda,
  ajuda,
  opcoes,
  valor,
  aoMudar,
  desativado = false,
}: GrupoOpcoesProps<T>) {
  const nome = useId()
  const idAjuda = useId()

  return (
    <fieldset
      disabled={desativado}
      aria-describedby={ajuda ? idAjuda : undefined}
      className="flex flex-col gap-2 disabled:opacity-50"
    >
      <legend className="mb-2 text-lg font-extrabold">{legenda}</legend>
      {ajuda && (
        <p id={idAjuda} className="-mt-1 mb-1 text-tinta-suave">
          {ajuda}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const marcado = opcao.valor === valor
          return (
            <label
              key={String(opcao.valor)}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-azul-escuro ${
                marcado
                  ? 'border-azul bg-ceu text-tinta'
                  : 'border-borda bg-white text-tinta-suave hover:border-azul'
              }`}
            >
              <input
                type="radio"
                name={nome}
                checked={marcado}
                onChange={() => aoMudar(opcao.valor)}
                className="sr-only"
              />
              {opcao.figura && <Figura nome={opcao.figura} alt="" className="size-7" />}
              {opcao.rotulo}
              {marcado && (
                <span aria-hidden="true" className="text-azul-escuro">
                  ✓
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
