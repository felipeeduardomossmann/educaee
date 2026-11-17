import { lazy, type ComponentType } from 'react'
import type { AtividadeId } from '../lib/atividade'
import { ATIVIDADES, carregadorDe } from './registro'
import type { PropsAtividade } from './tipos'

/** Componente de cada atividade, carregado sob demanda (null se não existe). */
export const COMPONENTES_ATIVIDADE = Object.fromEntries(
  ATIVIDADES.map((atividade) => {
    const carregar = carregadorDe(atividade)
    return [atividade.id, carregar ? lazy(carregar) : null]
  }),
) as Record<AtividadeId, ComponentType<PropsAtividade> | null>
