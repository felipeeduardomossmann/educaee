const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1'])

/** authDomain: em produção, o próprio domínio (login funciona com cookies de terceiros bloqueados). */
export function escolherAuthDomain(hostAtual: string, authDomainPadrao: string): string {
  const nomeHost = hostAtual.split(':')[0] ?? ''
  return HOSTS_LOCAIS.has(nomeHost) ? authDomainPadrao : hostAtual
}
