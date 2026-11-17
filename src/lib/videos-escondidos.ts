import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { banco } from './banco'

// Vídeos que a professora escondeu: lista de ids em users/{uid}.videosEscondidos
// (as regras do Firestore limitam a 500).

export const MAXIMO_ESCONDIDOS = 500

/** Acompanha a lista em tempo real (inclusive offline). Devolve a função que encerra. */
export function observarEscondidos(uid: string, aoMudar: (ids: Set<string>) => void): () => void {
  return onSnapshot(
    doc(banco, 'users', uid),
    (snapshot) => {
      const lista: unknown = snapshot.get('videosEscondidos')
      aoMudar(new Set(Array.isArray(lista) ? lista.filter((id) => typeof id === 'string') : []))
    },
    (erro) => console.warn('Não foi possível ler os vídeos escondidos', erro),
  )
}

/** Esconde um vídeo para esta professora. */
export function esconderVideo(uid: string, videoId: string): Promise<void> {
  return updateDoc(doc(banco, 'users', uid), { videosEscondidos: arrayUnion(videoId) })
}
