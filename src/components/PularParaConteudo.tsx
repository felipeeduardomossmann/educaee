/** Link escondido que aparece com o Tab: leva direto ao conteúdo principal (#conteudo). */
export default function PularParaConteudo() {
  return (
    <a
      href="#conteudo"
      className="sr-only rounded-lg bg-white px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  )
}
