import type { ResultadoRodada } from '../../lib/sessoes'
import type { RodadaAvaliada } from '../../lib/sugestao'

export interface RegistroRodada {
  /** Termina quando a rodada está salva no servidor. null = não é salva (convidado). */
  salva: Promise<void> | null
  /** Rodadas anteriores desta atividade, no mesmo nível, da mais nova para a mais antiga. */
  anteriores: Promise<RodadaAvaliada[]>
}

/** Origem e destino dos dados de quem joga (Firestore para o aluno, memória para o convidado). */
export interface FonteJogo {
  /** Nível atual de quem joga nesta atividade. */
  nivelAtual: number
  registrar: (resultado: ResultadoRodada, nivel: number) => RegistroRodada
  /** A professora aceitou a sugestão: muda o nível atual. */
  aceitarNivel: (nivel: number) => void
}
