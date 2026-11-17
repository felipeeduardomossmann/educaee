import { useEffect, useId, useRef, useState } from 'react'
import type { NomeFigura } from '../lib/figuras'
import {
  mudarPreferenciaTema,
  usePreferenciaTema,
  useTema,
  type PreferenciaTema,
} from '../lib/tema'
import Figura from './Figura'

const OPCOES: { valor: PreferenciaTema; rotulo: string; figura: NomeFigura }[] = [
  { valor: 'claro', rotulo: 'Claro', figura: 'sol' },
  { valor: 'escuro', rotulo: 'Escuro', figura: 'lua' },
  { valor: 'auto', rotulo: 'Automático', figura: 'engrenagem' },
]

/** Botão de sol/lua no topo: escolhe o tema claro, escuro ou automático. */
export default function SeletorTema() {
  const preferencia = usePreferenciaTema()
  const tema = useTema()
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const idLista = useId()
  const atual = OPCOES.find((opcao) => opcao.valor === preferencia) ?? OPCOES[0]

  useEffect(() => {
    if (!aberto) return
    const aoTocarFora = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false)
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    document.addEventListener('pointerdown', aoTocarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoTocarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <div ref={raiz} className="relative print:hidden">
      <button
        ref={botao}
        type="button"
        aria-label={`Tema da tela: ${atual.rotulo}. Mudar tema`}
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-ceu"
      >
        <Figura nome={tema === 'escuro' ? 'lua' : 'sol'} alt="" className="size-7" />
      </button>
      {aberto && (
        <div
          id={idLista}
          role="group"
          aria-label="Tema da tela"
          className="absolute top-12 right-0 z-30 flex w-64 flex-col gap-1 rounded-2xl border border-borda bg-white p-2 shadow-suave"
        >
          {OPCOES.map((opcao) => {
            const marcada = opcao.valor === preferencia
            return (
              <button
                key={opcao.valor}
                type="button"
                aria-pressed={marcada}
                onClick={() => {
                  mudarPreferenciaTema(opcao.valor)
                  setAberto(false)
                  botao.current?.focus()
                }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-bold hover:bg-ceu ${
                  marcada ? 'bg-ceu text-tinta' : 'text-tinta-suave'
                }`}
              >
                <Figura nome={opcao.figura} alt="" className="size-6 shrink-0" />
                <span className="flex-1">{opcao.rotulo}</span>
                {marcada && (
                  <span aria-hidden="true" className="text-azul-escuro">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
