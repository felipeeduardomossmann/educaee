import { useEffect, useState } from 'react'

/** true enquanto o navegador estiver com internet (eventos online/offline). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const mudar = () => setOnline(navigator.onLine)
    window.addEventListener('online', mudar)
    window.addEventListener('offline', mudar)
    return () => {
      window.removeEventListener('online', mudar)
      window.removeEventListener('offline', mudar)
    }
  }, [])
  return online
}
