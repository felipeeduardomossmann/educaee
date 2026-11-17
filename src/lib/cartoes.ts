import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import type { CartaoProprio } from '../prancha/prancha'
import { CATEGORIAS, type CategoriaId } from '../prancha/vocabulario'
import { banco } from './banco'

// Cartões próprios da prancha (users/{uid}/cartoes): da professora, reaproveitados entre os
// alunos dela. Pictograma em WebP pequeno e fala em MP3, guardados como data URL.

const colecao = (uid: string) => collection(banco, 'users', uid, 'cartoes')
const CATEGORIAS_IDS = CATEGORIAS.map((c) => c.id)

export function observarCartoes(
  uid: string,
  aoMudar: (cartoes: CartaoProprio[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return onSnapshot(
    query(colecao(uid), orderBy('criadoEm')),
    (resultado) =>
      aoMudar(
        resultado.docs.flatMap((d) => {
          const palavra = d.get('palavra') as unknown
          const categoria = d.get('categoria') as unknown
          const imagem = d.get('imagem') as unknown
          const audio = d.get('audio') as unknown
          if (typeof palavra !== 'string' || typeof imagem !== 'string') return []
          if (!CATEGORIAS_IDS.includes(categoria as CategoriaId)) return []
          return [
            {
              id: d.id,
              palavra,
              categoria: categoria as CategoriaId,
              imagem,
              audio: typeof audio === 'string' ? audio : null,
            },
          ]
        }),
      ),
    aoFalhar,
  )
}

export async function criarCartao(uid: string, cartao: Omit<CartaoProprio, 'id'>): Promise<string> {
  const referencia = await addDoc(colecao(uid), {
    palavra: cartao.palavra,
    categoria: cartao.categoria,
    imagem: cartao.imagem,
    audio: cartao.audio,
    criadoEm: serverTimestamp(),
  })
  return referencia.id
}

export function excluirCartao(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(colecao(uid), id))
}
