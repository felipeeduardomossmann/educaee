import { useId } from 'react'
import { useAlunos } from '../hooks/useAlunos'

/** Lista para abrir a prancha personalizada de um aluno (só com login). */
export default function EscolherAlunoPrancha({
  uid,
  aoEscolher,
}: {
  uid: string
  aoEscolher: (alunoId: string) => void
}) {
  const id = useId()
  const { alunos } = useAlunos(uid)
  if (alunos.length === 0) return null
  return (
    <label htmlFor={id} className="flex items-center gap-2 font-bold">
      <span className="sr-only sm:not-sr-only">Prancha de um aluno:</span>
      <select
        id={id}
        defaultValue=""
        onChange={(e) => e.target.value && aoEscolher(e.target.value)}
        className="min-h-12 rounded-2xl border-2 border-borda bg-white px-3 text-base text-tinta"
      >
        <option value="" disabled>
          Escolher aluno…
        </option>
        {alunos.map((aluno) => (
          <option key={aluno.id} value={aluno.id}>
            {aluno.nome}
          </option>
        ))}
      </select>
    </label>
  )
}
