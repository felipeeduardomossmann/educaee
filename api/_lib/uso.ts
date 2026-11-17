// Contadores de uso no Firestore (só o servidor acessa):
// {colecao}/{AAAA-MM} { total } e .../usuarios/{hash do uid} { dia, quantidade, noMes }

import { createHash } from 'node:crypto'
import { getFirestore, type DocumentData } from 'firebase-admin/firestore'
import { appAdmin } from './firebase-admin.js'
import {
  chaveDia,
  chaveMes,
  motivoBloqueio,
  type Limites,
  type MotivoLimite,
  type Uso,
} from './limites.js'

export function codigoUsuario(uid: string): string {
  return createHash('sha256').update(`educaee:${uid}`).digest('hex').slice(0, 32)
}

/** Período em que um uso foi contado (para devolver no mesmo lugar se der erro). */
export interface Periodo {
  dia: string
  mes: string
}

export function periodoAtual(agora = new Date()): Periodo {
  return { dia: chaveDia(agora), mes: chaveMes(agora) }
}

function lerUso(
  dadosMes: DocumentData | undefined,
  dadosUsuario: DocumentData | undefined,
  { dia }: Periodo,
): Uso {
  const totalMes = typeof dadosMes?.total === 'number' ? dadosMes.total : 0
  const mesmoDia = dadosUsuario?.dia === dia
  const usadosHoje =
    mesmoDia && typeof dadosUsuario?.quantidade === 'number' ? dadosUsuario.quantidade : 0
  // Documentos antigos não têm noMes: conta pelo menos os usos de hoje.
  const usadosNoMes = typeof dadosUsuario?.noMes === 'number' ? dadosUsuario.noMes : usadosHoje
  return { usadosHoje, totalMes, usadosNoMes }
}

export type Reserva = { ok: true; uso: Uso } | { ok: false; motivo: MotivoLimite; uso: Uso }

export interface Contador {
  limites: Limites
  consultar(uid: string, periodo: Periodo): Promise<Uso>
  /** Conta um uso antes de chamar a IA (numa transação, para não passar dos limites). */
  reservar(uid: string, periodo: Periodo): Promise<Reserva>
  /** Desfaz a reserva quando a IA recusou ou falhou (essas tentativas não contam). */
  devolver(uid: string, periodo: Periodo): Promise<Uso>
}

export function criarContador(colecao: string, limites: Limites): Contador {
  const referencias = (uid: string, { mes }: Periodo) => {
    const docMes = getFirestore(appAdmin()).collection(colecao).doc(mes)
    return { docMes, docUsuario: docMes.collection('usuarios').doc(codigoUsuario(uid)) }
  }

  const alterar = (uid: string, periodo: Periodo, delta: 1 | -1) => {
    const { docMes, docUsuario } = referencias(uid, periodo)
    return getFirestore(appAdmin()).runTransaction(async (transacao): Promise<Reserva> => {
      const [mes, usuario] = await transacao.getAll(docMes, docUsuario)
      const uso = lerUso(mes.data(), usuario.data(), periodo)
      const motivo = delta > 0 ? motivoBloqueio(uso, limites) : null
      if (motivo) return { ok: false, motivo, uso }
      const novo = {
        usadosHoje: Math.max(0, uso.usadosHoje + delta),
        totalMes: Math.max(0, uso.totalMes + delta),
        usadosNoMes: Math.max(0, (uso.usadosNoMes ?? 0) + delta),
      }
      transacao.set(docMes, { total: novo.totalMes }, { merge: true })
      transacao.set(docUsuario, {
        dia: periodo.dia,
        quantidade: novo.usadosHoje,
        noMes: novo.usadosNoMes,
      })
      return { ok: true, uso: novo }
    })
  }

  return {
    limites,
    async consultar(uid, periodo) {
      const { docMes, docUsuario } = referencias(uid, periodo)
      const [mes, usuario] = await Promise.all([docMes.get(), docUsuario.get()])
      return lerUso(mes.data(), usuario.data(), periodo)
    },
    reservar: (uid, periodo) => alterar(uid, periodo, 1),
    devolver: async (uid, periodo) => (await alterar(uid, periodo, -1)).uso,
  }
}
