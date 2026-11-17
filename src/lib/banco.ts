import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { app } from './firebase'

/** Firestore com cópia offline. Importar só onde precisar (o módulo é pesado). */
export const banco = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
