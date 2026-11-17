// /api/transferencia: POST { acao } com gerar, listar, cancelar, previa ou receber.
// Se a cópia falhar no meio, o que foi copiado é apagado e o código volta a valer.

import { randomInt } from 'node:crypto'
import {
  getFirestore,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase-admin/firestore'
import { appAdmin } from './_lib/firebase-admin.js'
import { json, uidDoPedido } from './_lib/http.js'
import {
  cartoesProprios,
  chaveHora,
  CODIGOS_ATIVOS_MAXIMO,
  contarTentativa,
  emLotes,
  gerarCodigo,
  motivoInvalido,
  normalizarCodigo,
  primeiroNome,
  remapearPrancha,
  VALIDADE_MS,
  type DadosCodigo,
} from './_lib/transferencia.js'
import { chaveDia, chaveMes } from './_lib/limites.js'
import { codigoUsuario } from './_lib/uso.js'

const banco = (): Firestore => getFirestore(appAdmin())
const codigos = () => banco().collection('transferencias')
const alunoRef = (uid: string, alunoId: string) =>
  banco().collection('users').doc(uid).collection('alunos').doc(alunoId)

const falhou = (codigo: string, status: number) => json({ codigo }, status)

function lerCodigo(dados: DocumentData | undefined): DadosCodigo | null {
  if (!dados) return null
  const expira = dados.expiraEm instanceof Timestamp ? dados.expiraEm.toMillis() : 0
  return {
    origemUid: String(dados.origemUid ?? ''),
    alunoId: String(dados.alunoId ?? ''),
    remover: dados.remover === true,
    expiraEm: expira,
    usado: dados.usado === true,
  }
}

/** Conta uma tentativa de prévia/recebimento; devolve o limite atingido, se houver. */
async function registrarTentativa(uid: string) {
  const ref = banco().collection('tentativasTransferencia').doc(codigoUsuario(uid))
  const agora = new Date()
  const janelas = { hora: chaveHora(agora), dia: chaveDia(agora), mes: chaveMes(agora) }
  return banco().runTransaction(async (t) => {
    const resultado = contarTentativa((await t.get(ref)).data(), janelas)
    if (resultado.ok) t.set(ref, resultado.contagem)
    return resultado
  })
}

async function gerar(uid: string, alunoId: unknown, remover: unknown) {
  if (typeof alunoId !== 'string' || !alunoId) return falhou('dados-invalidos', 400)
  if (!(await alunoRef(uid, alunoId).get()).exists) return falhou('aluno-nao-encontrado', 404)
  const ativos = await codigos().where('origemUid', '==', uid).get()
  const agora = Date.now()
  const validos = ativos.docs.filter((d) => {
    const c = lerCodigo(d.data())
    return c && !c.usado && c.expiraEm > agora
  })
  if (validos.length >= CODIGOS_ATIVOS_MAXIMO) return falhou('muitos-codigos', 429)
  const remetente = primeiroNome((await banco().collection('users').doc(uid).get()).get('nome'))
  const expiraEm = Timestamp.fromMillis(agora + VALIDADE_MS)
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo(randomInt)
    try {
      // create() falha se o código já existir: sorteia outro.
      await codigos()
        .doc(codigo)
        .create({
          origemUid: uid,
          alunoId,
          remover: remover === true,
          remetente,
          expiraEm,
          usado: false,
          criadoEm: Timestamp.now(),
        })
      return json({ codigo, expiraEm: expiraEm.toMillis() })
    } catch {
      // código repetido
    }
  }
  return falhou('falha', 502)
}

async function listar(uid: string, alunoId: unknown) {
  const agora = Date.now()
  const lista = await codigos().where('origemUid', '==', uid).get()
  return json({
    codigos: lista.docs
      .map((d) => ({ codigo: d.id, dados: lerCodigo(d.data()) }))
      .filter(
        ({ dados }) => dados && dados.alunoId === alunoId && !dados.usado && dados.expiraEm > agora,
      )
      .map(({ codigo, dados }) => ({ codigo, expiraEm: dados?.expiraEm, remover: dados?.remover })),
  })
}

async function cancelar(uid: string, bruto: unknown) {
  const codigo = normalizarCodigo(bruto)
  if (!codigo) return falhou('dados-invalidos', 400)
  const ref = codigos().doc(codigo)
  const dados = lerCodigo((await ref.get()).data())
  if (dados?.origemUid === uid) await ref.delete()
  return json({ ok: true })
}

/** Confere o código e o aluno de origem (comum à prévia e ao recebimento). */
async function conferir(uid: string, bruto: unknown) {
  const codigo = normalizarCodigo(bruto)
  if (!codigo) return { ok: false, erro: falhou('codigo-invalido', 404) } as const
  const tentativa = await registrarTentativa(uid)
  if (!tentativa.ok) return { ok: false, erro: falhou(tentativa.motivo, 429) } as const
  const doc = await codigos().doc(codigo).get()
  const dados = lerCodigo(doc.data())
  const motivo = motivoInvalido(dados, uid, Date.now())
  if (motivo || !dados)
    return { ok: false, erro: falhou(motivo ?? 'codigo-invalido', 404) } as const
  const aluno = await alunoRef(dados.origemUid, dados.alunoId).get()
  if (!aluno.exists) return { ok: false, erro: falhou('codigo-invalido', 404) } as const
  return {
    ok: true,
    codigo,
    dados,
    aluno,
    remetente: String(doc.get('remetente') ?? 'uma professora'),
  } as const
}

async function previa(uid: string, bruto: unknown) {
  const conferido = await conferir(uid, bruto)
  if (!conferido.ok) return conferido.erro
  const { aluno, remetente } = conferido
  const contagem = await aluno.ref.collection('sessoes').count().get()
  return json({
    nome: String(aluno.get('nome') ?? ''),
    turma: String(aluno.get('turma') ?? ''),
    remetente,
    rodadas: contagem.data().count,
  })
}

async function receber(uid: string, bruto: unknown) {
  const conferido = await conferir(uid, bruto)
  if (!conferido.ok) return conferido.erro
  const { codigo, dados } = conferido
  const refCodigo = codigos().doc(codigo)

  // 1) Reserva o código (uso único), numa transação.
  const reservado = await banco().runTransaction(async (t) => {
    const atual = lerCodigo((await t.get(refCodigo)).data())
    if (motivoInvalido(atual, uid, Date.now())) return false
    t.update(refCodigo, { usado: true })
    return true
  })
  if (!reservado) return falhou('codigo-invalido', 404)

  const origem = alunoRef(dados.origemUid, dados.alunoId)
  const destino = banco().collection('users').doc(uid).collection('alunos').doc()
  const cartoesCriados: DocumentReference[] = []
  try {
    const [alunoDoc, sessoes] = await Promise.all([
      origem.get(),
      origem.collection('sessoes').get(),
    ])
    const aluno = alunoDoc.data()
    if (!aluno) throw new Error('aluno sumiu')

    // 2) Cartões próprios usados na prancha → coleção de quem recebe (ids novos).
    const mapa = new Map<string, string>()
    const colecaoCartoes = banco().collection('users').doc(uid).collection('cartoes')
    for (const idVelho of cartoesProprios(aluno.prancha)) {
      const cartao = await banco()
        .collection('users')
        .doc(dados.origemUid)
        .collection('cartoes')
        .doc(idVelho)
        .get()
      if (!cartao.exists) continue
      const novo = colecaoCartoes.doc()
      await novo.set({ ...cartao.data(), criadoEm: Timestamp.now() })
      cartoesCriados.push(novo)
      mapa.set(idVelho, novo.id)
    }

    // 3) Sessões em lotes.
    for (const lote of emLotes(sessoes.docs)) {
      const escrita = banco().batch()
      for (const s of lote) escrita.set(destino.collection('sessoes').doc(s.id), s.data())
      await escrita.commit()
    }

    // 4) O aluno por último (até aqui, nada aparece para quem recebe).
    const agora = Timestamp.now()
    const novoAluno: DocumentData = { ...aluno, criadoEm: agora, atualizadoEm: agora }
    if (aluno.prancha) novoAluno.prancha = remapearPrancha(aluno.prancha, mapa)
    await destino.set(novoAluno)
  } catch (e) {
    console.error('Transferência: falhou no meio, desfazendo', e)
    await banco()
      .recursiveDelete(destino)
      .catch(() => {})
    await Promise.all(cartoesCriados.map((r) => r.delete().catch(() => {})))
    await refCodigo.update({ usado: false }).catch(() => {})
    return falhou('falha', 502)
  }

  // 5) Deu certo: o código some e, se pedido, o aluno sai da conta de origem.
  await refCodigo.delete().catch(() => {})
  if (dados.remover) {
    await banco()
      .recursiveDelete(origem)
      .catch((e: unknown) => console.error('Transferência: não removeu o original', e))
  }
  return json({ alunoId: destino.id, nome: String((await destino.get()).get('nome') ?? '') })
}

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request)
  if (!uid) return falhou('sem-login', 401)
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null
  switch (corpo?.acao) {
    case 'gerar':
      return gerar(uid, corpo.alunoId, corpo.remover)
    case 'listar':
      return listar(uid, corpo.alunoId)
    case 'cancelar':
      return cancelar(uid, corpo.codigo)
    case 'previa':
      return previa(uid, corpo.codigo)
    case 'receber':
      return receber(uid, corpo.codigo)
    default:
      return falhou('dados-invalidos', 400)
  }
}
