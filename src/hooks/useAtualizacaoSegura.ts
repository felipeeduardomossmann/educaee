import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useConvidado } from '../contexts/convidado-contexto'
import { aplicarAtualizacaoPendente } from '../lib/atualizacao'

/** Aplica a versão nova ao trocar de página, fora das atividades e do modo convidado. */
export function useAtualizacaoSegura() {
  const { pathname } = useLocation()
  const { ativo: convidadoAtivo } = useConvidado()
  useEffect(() => {
    if (convidadoAtivo || pathname.startsWith('/atividade/')) return
    aplicarAtualizacaoPendente()
  }, [pathname, convidadoAtivo])
}
