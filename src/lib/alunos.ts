import {
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase/firestore'
import type { Aluno, DadosAluno } from './aluno'
import type { AnaliseSalva, TextoAnalise } from './analise'
import { lerConfigPrancha, type ConfigPrancha } from '../prancha/prancha'
import { lerNiveis, NIVEIS_DO_CADASTRO, type AtividadeId } from './atividade'
import { banco } from './banco'
import { lerPerfil, type Perfil } from './perfil'

// O Firestore aceita no máximo 500 operações por lote.
const TAMANHO_LOTE = 500

function colecaoAlunos(uid: string) {
  return collection(banco, 'users', uid, 'alunos')
}

// A análise fica no aluno com cada lista como um texto só, um item por linha (as regras do
// Firestore validam strings com facilidade; listas, não).
const PERIODOS_ANALISE = ['7', '30', 'tudo'] as const
const SEPARADOR = '\n'

function lerAnalise(valor: unknown): AnaliseSalva | null {
  if (!valor || typeof valor !== 'object') return null
  const a = valor as Record<string, unknown>
  const linhas = (v: unknown) => (typeof v === 'string' && v !== '' ? v.split(SEPARADOR) : [])
  const periodo = PERIODOS_ANALISE.find((p) => p === a.periodo)
  // Logo depois de salvar, a data ainda é a estimativa local (serverTimestamp pendente).
  const geradaEm = a.geradaEm instanceof Timestamp ? a.geradaEm.toDate() : null
  if (!periodo || !geradaEm || typeof a.visaoGeral !== 'string') return null
  return {
    visaoGeral: linhas(a.visaoGeral),
    // Análises antigas (antes de 11/2026) não têm "fortes".
    fortes: linhas(a.fortes),
    evoluiu: linhas(a.evoluiu),
    atencao: linhas(a.atencao),
    sugestoes: linhas(a.sugestoes),
    periodo,
    rodadas: typeof a.rodadas === 'number' ? a.rodadas : 0,
    geradaEm,
  }
}

function paraAluno(snapshot: DocumentSnapshot): Aluno {
  return {
    id: snapshot.id,
    nome: String(snapshot.get('nome') ?? ''),
    turma: String(snapshot.get('turma') ?? ''),
    perfil: lerPerfil(snapshot.get('perfil')),
    niveis: lerNiveis(snapshot.get('niveis')),
    analise: lerAnalise(snapshot.get('analise', { serverTimestamps: 'estimate' })),
    prancha: lerConfigPrancha(snapshot.get('prancha')),
  }
}

/** Acompanha a lista de alunos em tempo real; devolve a função que encerra. */
export function observarAlunos(
  uid: string,
  aoMudar: (alunos: Aluno[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return onSnapshot(
    colecaoAlunos(uid),
    (resultado) => aoMudar(resultado.docs.map(paraAluno)),
    aoFalhar,
  )
}

/** Lê um aluno (do servidor, ou da cópia local se estiver offline). null se não existir. */
export async function lerAluno(uid: string, alunoId: string): Promise<Aluno | null> {
  const snapshot = await getDoc(doc(colecaoAlunos(uid), alunoId))
  return snapshot.exists() ? paraAluno(snapshot) : null
}

/** Cria um aluno (a promessa termina quando o servidor confirma). */
export function criarAluno(uid: string, dados: DadosAluno): Promise<void> {
  const referencia = doc(colecaoAlunos(uid))
  return setDoc(referencia, {
    nome: dados.nome,
    turma: dados.turma,
    perfil: dados.perfil,
    niveis: NIVEIS_DO_CADASTRO,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
}

/** Atualiza nome, turma e perfil. Mesma regra de confirmação do criarAluno. */
export function atualizarAluno(uid: string, alunoId: string, dados: DadosAluno): Promise<void> {
  return updateDoc(doc(colecaoAlunos(uid), alunoId), {
    nome: dados.nome,
    turma: dados.turma,
    perfil: dados.perfil,
    atualizadoEm: serverTimestamp(),
  })
}

/** Acompanha um aluno em tempo real. Recebe null se ele não existir (ou for excluído). */
export function observarAluno(
  uid: string,
  alunoId: string,
  aoMudar: (aluno: Aluno | null) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return onSnapshot(
    doc(colecaoAlunos(uid), alunoId),
    (snapshot) => aoMudar(snapshot.exists() ? paraAluno(snapshot) : null),
    aoFalhar,
  )
}

/** Salva só o perfil (botão "Ajustes" na escolha de atividade). */
export function atualizarPerfil(uid: string, alunoId: string, perfil: Perfil): Promise<void> {
  return updateDoc(doc(colecaoAlunos(uid), alunoId), { perfil, atualizadoEm: serverTimestamp() })
}

/** Muda o nível atual do aluno numa atividade (quando a professora aceita a sugestão). */
export function atualizarNivel(
  uid: string,
  alunoId: string,
  atividadeId: AtividadeId,
  nivel: number,
): Promise<void> {
  return updateDoc(doc(colecaoAlunos(uid), alunoId), {
    [`niveis.${atividadeId}`]: nivel,
    atualizadoEm: serverTimestamp(),
  })
}

/** Salva a última análise do aluno (substitui a anterior). */
export function salvarAnalise(
  uid: string,
  alunoId: string,
  analise: TextoAnalise,
  periodo: AnaliseSalva['periodo'],
  rodadas: number,
): Promise<void> {
  return updateDoc(doc(colecaoAlunos(uid), alunoId), {
    analise: {
      visaoGeral: analise.visaoGeral.join(SEPARADOR),
      fortes: analise.fortes.join(SEPARADOR),
      evoluiu: analise.evoluiu.join(SEPARADOR),
      atencao: analise.atencao.join(SEPARADOR),
      sugestoes: analise.sugestoes.join(SEPARADOR),
      periodo,
      rodadas,
      geradaEm: serverTimestamp(),
    },
    atualizadoEm: serverTimestamp(),
  })
}

/** Salva a prancha personalizada do aluno (cartões, ordem e cartões por tela). */
export function salvarPrancha(uid: string, alunoId: string, prancha: ConfigPrancha): Promise<void> {
  return updateDoc(doc(colecaoAlunos(uid), alunoId), {
    prancha: { cartoes: prancha.cartoes, porTela: prancha.porTela },
    atualizadoEm: serverTimestamp(),
  })
}

/** Exclui documentos em lotes de até 500. Só termina quando o servidor confirma. */
export async function excluirEmLotes(referencias: DocumentReference[]): Promise<void> {
  for (let inicio = 0; inicio < referencias.length; inicio += TAMANHO_LOTE) {
    const lote = writeBatch(banco)
    for (const referencia of referencias.slice(inicio, inicio + TAMANHO_LOTE)) {
      lote.delete(referencia)
    }
    await lote.commit()
  }
}

/** Exclui um aluno: primeiro todas as sessões dele, depois o documento do aluno. */
export async function excluirAluno(uid: string, alunoId: string): Promise<void> {
  const sessoes = await getDocsFromServer(collection(colecaoAlunos(uid), alunoId, 'sessoes'))
  await excluirEmLotes(sessoes.docs.map((sessao) => sessao.ref))
  await excluirEmLotes([doc(colecaoAlunos(uid), alunoId)])
}
