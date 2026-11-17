/** Tela de espera simples, sem animação. */
export default function Carregando() {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center p-4">
      <p className="text-lg font-semibold text-tinta-suave">Carregando…</p>
    </div>
  )
}
