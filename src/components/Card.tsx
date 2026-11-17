import type { HTMLAttributes } from 'react'

export type CorCard = 'branco' | 'ceu' | 'menta' | 'pessego' | 'lilas' | 'sol' | 'rosa'

const cores: Record<CorCard, string> = {
  branco: 'bg-white',
  ceu: 'bg-ceu',
  menta: 'bg-menta',
  pessego: 'bg-pessego',
  lilas: 'bg-lilas',
  sol: 'bg-sol',
  rosa: 'bg-rosa',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  cor?: CorCard
}

export default function Card({ cor = 'branco', className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-borda p-6 shadow-suave ${cores[cor]} ${className}`}
      {...props}
    />
  )
}
