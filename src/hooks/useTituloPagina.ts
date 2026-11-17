import { useEffect } from 'react'

/** Define o título da aba do navegador: "<titulo> – EducAEE". */
export function useTituloPagina(titulo?: string) {
  useEffect(() => {
    document.title = titulo
      ? `${titulo} – EducAEE`
      : 'EducAEE – Trilhando a sua evolução de maneira personalizada'
  }, [titulo])
}
