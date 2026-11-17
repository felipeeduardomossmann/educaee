import LayoutLogado from '../components/LayoutLogado'
import RelatorioProgresso from '../components/progresso/RelatorioProgresso'
import { useTituloPagina } from '../hooks/useTituloPagina'
import type { Aluno } from '../lib/aluno'
import { NIVEIS_INICIAIS, type AtividadeId } from '../lib/atividade'
import { PERFIL_PADRAO } from '../lib/perfil'
import type { Sessao } from '../lib/sessoes'

const ALUNO: Aluno = {
  id: 'exemplo',
  nome: 'Ana',
  turma: '3º ano B',
  perfil: PERFIL_PADRAO,
  niveis: { ...NIVEIS_INICIAIS, memoria: 2, igual: 3 },
}

/** Rodadas inventadas dos últimos 40 dias, melhorando aos poucos. */
function sessoesDeExemplo(): Sessao[] {
  const agora = Date.now()
  const sessoes: Sessao[] = []
  const plano: [AtividadeId, number][] = [
    ['memoria', 12],
    ['igual', 16],
    ['alvo', 6],
  ]
  for (const [atividadeId, quantidade] of plano) {
    for (let i = 0; i < quantidade; i++) {
      const progresso = i / quantidade
      const erros = Math.max(0, Math.round(6 - progresso * 6 + ((i * 7) % 3)))
      sessoes.push({
        id: `${atividadeId}-${i}`,
        atividadeId,
        nivel: atividadeId === 'igual' && i > 10 ? 3 : 2,
        acertos: atividadeId === 'memoria' ? 4 : 8,
        erros,
        duracaoSeg: 60 + ((i * 37) % 90),
        concluidaEm: new Date(agora - (40 - (i * 40) / quantidade) * 24 * 60 * 60 * 1000),
      })
    }
  }
  return sessoes.sort((a, b) => b.concluidaEm.getTime() - a.concluidaEm.getTime())
}

/** Só no modo de desenvolvimento: o relatório com dados de exemplo (sem login). */
export default function ExemploProgresso() {
  useTituloPagina('Progresso (exemplo)')
  return (
    <LayoutLogado>
      <RelatorioProgresso
        aluno={ALUNO}
        sessoes={sessoesDeExemplo()}
        carregando={false}
        erro={false}
      />
    </LayoutLogado>
  )
}
