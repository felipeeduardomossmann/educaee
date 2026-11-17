interface FaixaConvidadoProps {
  aoEntrar: () => void
}

/** Faixa fixa e discreta mostrada no topo durante o modo convidado. */
export default function FaixaConvidado({ aoEntrar }: FaixaConvidadoProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-sol px-4 py-2 text-center text-sm text-tinta"
    >
      <span>Você está no modo convidado: nada será salvo.</span>
      <button
        type="button"
        onClick={aoEntrar}
        className="min-h-8 rounded-lg px-2 font-bold text-azul-escuro underline underline-offset-2 hover:bg-white/60"
      >
        Entrar com Google
      </button>
    </div>
  )
}
