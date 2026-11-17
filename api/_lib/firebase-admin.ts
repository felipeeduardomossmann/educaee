import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'

/** O JSON baixado do console (campos em snake_case, como project_id). */
type ContaDeServico = ServiceAccount & { project_id: string }

function contaDeServico(): ContaDeServico {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurada')
  return JSON.parse(json) as ContaDeServico
}

/** ID do projeto do Firebase (o mesmo da conta de serviço). */
export function idProjeto(): string {
  return contaDeServico().project_id
}

/** App do Firebase Admin (só para o Firestore), criado uma vez a partir da conta de serviço. */
export function appAdmin(): App {
  const existente = getApps()[0]
  if (existente) return existente
  return initializeApp({ credential: cert(contaDeServico()) })
}
