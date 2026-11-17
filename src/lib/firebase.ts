import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { escolherAuthDomain } from './auth-dominio'

const env = import.meta.env

const faltando = (
  [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ] as const
).filter((nome) => !env[nome])
if (faltando.length > 0) {
  throw new Error(`Variáveis de ambiente faltando: ${faltando.join(', ')}. Veja o README.`)
}

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: escolherAuthDomain(window.location.host, env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

// Auth sem o resolvedor de popup/redirect na inicialização (deixava o celular mais lento);
// ele é passado só nas chamadas de login.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
})
export const resolvedorLogin = browserPopupRedirectResolver
auth.languageCode = 'pt-BR'

export const provedorGoogle = new GoogleAuthProvider()
// Sempre mostra a escolha de conta: útil em computadores compartilhados da escola.
provedorGoogle.setCustomParameters({ prompt: 'select_account' })
