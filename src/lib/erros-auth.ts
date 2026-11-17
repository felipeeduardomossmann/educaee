/** Erros de login que significam só "a pessoa desistiu": não mostram mensagem. */
const CODIGOS_SILENCIOSOS = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

const MENSAGENS: Record<string, string> = {
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique a rede e tente de novo.',
  'auth/unauthorized-domain': 'Este endereço do site não está autorizado para login.',
  'auth/user-disabled': 'Esta conta Google foi desativada.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
}

/** Mensagem amigável para um erro de login, ou null quando não há o que avisar. */
export function mensagemErroLogin(codigo: string): string | null {
  if (CODIGOS_SILENCIOSOS.has(codigo)) return null
  return MENSAGENS[codigo] ?? 'Não foi possível entrar. Tente de novo.'
}

export function codigoDoErro(erro: unknown): string {
  if (typeof erro === 'object' && erro !== null && 'code' in erro) {
    return String(erro.code)
  }
  return ''
}
