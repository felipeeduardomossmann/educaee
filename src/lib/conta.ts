import type { User } from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  serverTimestamp,
  setDoc,
  terminate,
} from 'firebase/firestore'
import { excluirAluno, excluirEmLotes } from './alunos'
import { banco } from './banco'

/** Cria o documento users/{uid} no primeiro login e mantém nome e e-mail atualizados. */
export async function registrarUsuario(usuario: User): Promise<void> {
  const referencia = doc(banco, 'users', usuario.uid)
  const dados = { email: usuario.email ?? '', nome: usuario.displayName ?? '' }
  const existente = await getDoc(referencia)
  if (!existente.exists()) {
    await setDoc(referencia, { ...dados, criadoEm: serverTimestamp() })
  } else if (existente.get('email') !== dados.email || existente.get('nome') !== dados.nome) {
    await setDoc(referencia, dados, { merge: true })
  }
}

/** Apaga todos os alunos (com as sessões), os cartões da prancha e o documento do usuário. */
export async function excluirDadosDoUsuario(uid: string): Promise<void> {
  const alunos = await getDocsFromServer(collection(banco, 'users', uid, 'alunos'))
  for (const aluno of alunos.docs) {
    await excluirAluno(uid, aluno.id)
  }
  const cartoes = await getDocsFromServer(collection(banco, 'users', uid, 'cartoes'))
  await excluirEmLotes(cartoes.docs.map((cartao) => cartao.ref))
  await excluirEmLotes([doc(banco, 'users', uid)])
}

/** Apaga a cópia offline do banco neste navegador (recarregar a página depois). */
export async function limparCopiaLocal(): Promise<void> {
  await terminate(banco)
  await clearIndexedDbPersistence(banco)
}
