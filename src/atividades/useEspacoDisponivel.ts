import { useEffect, useRef, useState } from 'react'

/** Espaço para o jogo: largura do elemento e altura até o pé da janela. */
export function useEspacoDisponivel<T extends HTMLElement>(margemInferior = 80) {
  const ref = useRef<T>(null)
  const [espaco, setEspaco] = useState({ largura: 0, altura: 0 })

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const medir = () => {
      const retangulo = elemento.getBoundingClientRect()
      const largura = Math.floor(retangulo.width)
      const altura = Math.max(0, Math.floor(window.innerHeight - retangulo.top - margemInferior))
      setEspaco((anterior) =>
        anterior.largura === largura && anterior.altura === altura ? anterior : { largura, altura },
      )
    }
    medir()
    // Muda com a janela e também quando o texto da instrução acima muda de tamanho.
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    observador.observe(document.body)
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [margemInferior])

  return { ref, ...espaco }
}
