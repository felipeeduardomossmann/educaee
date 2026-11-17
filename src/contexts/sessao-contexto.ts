import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'

export interface Sessao {
  /** Usuário logado, ou null (sem login ou modo convidado). */
  usuario: User | null
  /** true enquanto o Firebase ainda verifica se há uma sessão salva. */
  carregando: boolean
  /** true enquanto o login com Google está em andamento. */
  entrando: boolean
  /** Abre o login com Google (popup, com redirect se o popup for bloqueado). */
  entrar: () => Promise<void>
  /** Sai da conta e apaga a cópia local dos dados neste navegador. */
  sair: () => Promise<void>
}

export const SessaoContexto = createContext<Sessao | null>(null)

export function useSessao(): Sessao {
  const sessao = useContext(SessaoContexto)
  if (!sessao) throw new Error('useSessao precisa estar dentro de <SessaoProvider>')
  return sessao
}

/** Usuário logado, para telas dentro de <RotaComLogin> (lá ele nunca é null). */
export function useUsuarioLogado(): User {
  const { usuario } = useSessao()
  if (!usuario) throw new Error('useUsuarioLogado só pode ser usado em rotas com login')
  return usuario
}
