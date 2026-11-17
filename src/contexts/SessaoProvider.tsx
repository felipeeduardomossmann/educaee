import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Botao from '../components/Botao'
import Modal from '../components/Modal'
import { codigoDoErro, mensagemErroLogin } from '../lib/erros-auth'
import { auth, provedorGoogle, resolvedorLogin } from '../lib/firebase'
import { SessaoContexto, type Sessao } from './sessao-contexto'

// Quando o popup não pode ser usado, o login continua pela página inteira (redirect).
const CODIGOS_PARA_REDIRECT = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
])

export default function SessaoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<User | null>(null)
  const [authPronto, setAuthPronto] = useState(false)
  // A volta de um login por redirect é conferida à parte; até lá, a sessão segue "carregando"
  // (senão a página mostraria "Entrar" por um instante antes de ir para o painel).
  const [redirectConferido, setRedirectConferido] = useState(false)
  const carregando = !authPronto || !redirectConferido
  const [entrando, setEntrando] = useState(false)
  const [erroLogin, setErroLogin] = useState<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (novoUsuario) => {
      setUsuario(novoUsuario)
      setAuthPronto(true)
      if (novoUsuario) {
        // O banco é carregado só depois do login, para a página inicial ficar leve.
        import('../lib/conta')
          .then(({ registrarUsuario }) => registrarUsuario(novoUsuario))
          .catch((erro: unknown) => console.warn('Não foi possível registrar o usuário', erro))
      }
    })
  }, [])

  // Volta de um login feito por redirect.
  useEffect(() => {
    getRedirectResult(auth, resolvedorLogin)
      .then((resultado) => {
        if (resultado) void navigate('/painel')
      })
      .catch((erro: unknown) => setErroLogin(mensagemErroLogin(codigoDoErro(erro))))
      .finally(() => setRedirectConferido(true))
  }, [navigate])

  const entrar = useCallback(async () => {
    setErroLogin(null)
    setEntrando(true)
    try {
      await signInWithPopup(auth, provedorGoogle, resolvedorLogin)
      await navigate('/painel')
    } catch (erro) {
      const codigo = codigoDoErro(erro)
      if (CODIGOS_PARA_REDIRECT.has(codigo)) {
        await signInWithRedirect(auth, provedorGoogle, resolvedorLogin)
        return
      }
      setErroLogin(mensagemErroLogin(codigo))
    } finally {
      setEntrando(false)
    }
  }, [navigate])

  const sair = useCallback(async () => {
    await signOut(auth)
    const { limparCopiaLocal } = await import('../lib/conta')
    await limparCopiaLocal().catch((erro: unknown) => console.warn(erro))
    // Recarrega a página para começar do zero (o banco local foi encerrado).
    window.location.assign('/')
  }, [])

  const sessao = useMemo<Sessao>(
    () => ({ usuario, carregando, entrando, entrar, sair }),
    [usuario, carregando, entrando, entrar, sair],
  )

  return (
    <SessaoContexto value={sessao}>
      {children}
      <Modal
        aberto={erroLogin !== null}
        titulo="Não foi possível entrar"
        aoFechar={() => setErroLogin(null)}
        acoes={<Botao onClick={() => setErroLogin(null)}>Entendi</Botao>}
      >
        {erroLogin}
      </Modal>
    </SessaoContexto>
  )
}
