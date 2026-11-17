import type { User } from 'firebase/auth'
import { useState } from 'react'

interface FotoUsuarioProps {
  usuario: User
  className?: string
}

/** Foto da conta Google. Sem foto (ou se não carregar), mostra a inicial do nome. */
export default function FotoUsuario({ usuario, className = 'size-10' }: FotoUsuarioProps) {
  const [falhou, setFalhou] = useState(false)
  const inicial = (usuario.displayName ?? usuario.email ?? '?').charAt(0).toUpperCase()

  if (usuario.photoURL && !falhou) {
    return (
      <img
        src={usuario.photoURL}
        alt=""
        // Sem "referrer", as fotos do Google carregam de forma mais confiável.
        referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lilas font-extrabold text-tinta ${className}`}
    >
      {inicial}
    </span>
  )
}
