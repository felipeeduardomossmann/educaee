import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { ATIVIDADES_IDS, type AtividadeId } from './atividade'
import { banco } from './banco'

export interface ResultadoRodada {
  acertos: number
  erros: number
  duracaoSeg: number
}

export interface Sessao extends ResultadoRodada {
  id: string
  atividadeId: AtividadeId
  nivel: number
  concluidaEm: Date
}

function colecaoSessoes(uid: string, alunoId: string) {
  return collection(banco, 'users', uid, 'alunos', alunoId, 'sessoes')
}

function paraSessao(snapshot: DocumentSnapshot): Sessao | null {
  const atividadeId = snapshot.get('atividadeId') as unknown
  const concluidaEm = snapshot.get('concluidaEm') as unknown
  if (!ATIVIDADES_IDS.some((id) => id === atividadeId) || !(concluidaEm instanceof Timestamp)) {
    return null
  }
  return {
    id: snapshot.id,
    atividadeId: atividadeId as AtividadeId,
    nivel: Number(snapshot.get('nivel')),
    acertos: Number(snapshot.get('acertos')),
    erros: Number(snapshot.get('erros')),
    duracaoSeg: Number(snapshot.get('duracaoSeg')),
    concluidaEm: concluidaEm.toDate(),
  }
}

/** Grava uma rodada. `salva` termina quando o servidor confirma (offline, espera a conexão). */
export function registrarSessao(
  uid: string,
  alunoId: string,
  atividadeId: AtividadeId,
  nivel: number,
  resultado: ResultadoRodada,
): { id: string; salva: Promise<void> } {
  const referencia = doc(colecaoSessoes(uid, alunoId))
  const salva = setDoc(referencia, {
    atividadeId,
    nivel,
    acertos: resultado.acertos,
    erros: resultado.erros,
    duracaoSeg: resultado.duracaoSeg,
    concluidaEm: Timestamp.now(),
  })
  return { id: referencia.id, salva }
}

/** As rodadas mais recentes do aluno (da mais nova para a mais antiga). */
export async function buscarSessoesRecentes(
  uid: string,
  alunoId: string,
  quantidade = 50,
): Promise<Sessao[]> {
  const resultado = await getDocs(
    query(colecaoSessoes(uid, alunoId), orderBy('concluidaEm', 'desc'), limit(quantidade)),
  )
  return resultado.docs.map(paraSessao).filter((sessao) => sessao !== null)
}

/** Acompanha todas as rodadas do aluno em tempo real (da mais nova para a mais antiga). */
export function observarSessoes(
  uid: string,
  alunoId: string,
  aoMudar: (sessoes: Sessao[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return onSnapshot(
    query(colecaoSessoes(uid, alunoId), orderBy('concluidaEm', 'desc')),
    (resultado) => aoMudar(resultado.docs.map(paraSessao).filter((sessao) => sessao !== null)),
    aoFalhar,
  )
}
