import type { User } from 'firebase/auth'
import { chamarApi } from './api'

// Transferência de aluno por código (/api/transferencia). Tudo acontece no servidor.

export type CodigoErroTransferencia =
  | 'sem-login'
  | 'dados-invalidos'
  | 'aluno-nao-encontrado'
  | 'muitos-codigos'
  | 'codigo-invalido'
  | 'proprio-aluno'
  | 'limite-tentativas'
  | 'limite-tentativas-dia'
  | 'limite-tentativas-mes'
  | 'falha'

export const MENSAGENS_TRANSFERENCIA: Record<CodigoErroTransferencia, string> = {
  'sem-login': 'Sua sessão expirou. Saia e entre de novo para continuar.',
  'dados-invalidos': 'Confira o código: são 6 letras e números.',
  'aluno-nao-encontrado': 'Aluno não encontrado.',
  'muitos-codigos': 'Você já tem muitos códigos ativos. Cancele algum antes de gerar outro.',
  'codigo-invalido': 'Código não encontrado, já usado ou vencido. Confira com quem enviou.',
  'proprio-aluno': 'Este código é de um aluno da sua própria conta.',
  'limite-tentativas': 'Muitas tentativas seguidas. Espere uma hora e tente de novo.',
  'limite-tentativas-dia': 'Você chegou ao limite de tentativas de hoje. Tente de novo amanhã.',
  'limite-tentativas-mes':
    'Você chegou ao limite de tentativas deste mês. Ele volta no dia 1º do mês que vem.',
  falha: 'Não foi possível concluir agora. Verifique a internet e tente de novo.',
}

const CODIGOS = new Set(Object.keys(MENSAGENS_TRANSFERENCIA))

type Resultado<T> = ({ ok: true } & T) | { ok: false; codigo: CodigoErroTransferencia }

async function pedir<T>(usuario: User, corpo: Record<string, unknown>): Promise<Resultado<T>> {
  try {
    const { resposta, dados } = await chamarApi(usuario, '/api/transferencia', corpo)
    if (resposta.ok && dados && typeof dados === 'object') return { ok: true, ...(dados as T) }
    const codigo = (dados as { codigo?: unknown } | null)?.codigo
    return {
      ok: false,
      codigo:
        typeof codigo === 'string' && CODIGOS.has(codigo)
          ? (codigo as CodigoErroTransferencia)
          : 'falha',
    }
  } catch {
    return { ok: false, codigo: 'falha' }
  }
}

export interface CodigoAtivo {
  codigo: string
  expiraEm: number
  remover: boolean
}

export const gerarCodigo = (usuario: User, alunoId: string, remover: boolean) =>
  pedir<{ codigo: string; expiraEm: number }>(usuario, { acao: 'gerar', alunoId, remover })

export const listarCodigos = (usuario: User, alunoId: string) =>
  pedir<{ codigos: CodigoAtivo[] }>(usuario, { acao: 'listar', alunoId })

export const cancelarCodigo = (usuario: User, codigo: string) =>
  pedir<object>(usuario, { acao: 'cancelar', codigo })

export interface PreviaAluno {
  nome: string
  turma: string
  remetente: string
  rodadas: number
}

export const verPrevia = (usuario: User, codigo: string) =>
  pedir<PreviaAluno>(usuario, { acao: 'previa', codigo })

export const receberAluno = (usuario: User, codigo: string) =>
  pedir<{ alunoId: string; nome: string }>(usuario, { acao: 'receber', codigo })

/** Para digitar: maiúsculas, sem espaços, até 6 caracteres. */
export function formatarCodigoDigitado(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}
