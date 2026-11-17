import { deleteUser, reauthenticateWithPopup, type User } from 'firebase/auth'
import { useId, useState } from 'react'
import Botao from '../components/Botao'
import Card from '../components/Card'
import FotoUsuario from '../components/FotoUsuario'
import LayoutLogado from '../components/LayoutLogado'
import Modal from '../components/Modal'
import { useSessao } from '../contexts/sessao-contexto'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { excluirDadosDoUsuario, limparCopiaLocal } from '../lib/conta'
import { codigoDoErro } from '../lib/erros-auth'
import { provedorGoogle, resolvedorLogin } from '../lib/firebase'

const PALAVRA_CONFIRMACAO = 'EXCLUIR'

type EtapaExclusao = 'fechado' | 'confirmando' | 'excluindo' | 'novo-login'

/** Apaga a conta no Firebase Auth e a cópia local, e volta para a página inicial. */
async function apagarConta(usuario: User) {
  await deleteUser(usuario)
  await limparCopiaLocal().catch((erro: unknown) => console.warn(erro))
  window.location.assign('/?conta-excluida')
}

export default function Conta() {
  useTituloPagina('Minha conta')
  const { usuario, sair } = useSessao()
  const idCampo = useId()
  const [etapa, setEtapa] = useState<EtapaExclusao>('fechado')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [saindo, setSaindo] = useState(false)

  if (!usuario) return null

  const fechar = () => {
    if (etapa === 'excluindo') return
    setEtapa('fechado')
    setConfirmacao('')
    setErro(null)
  }

  const excluir = async () => {
    setErro(null)
    if (!navigator.onLine) {
      setErro('Sem conexão com a internet. Conecte-se para excluir a conta.')
      return
    }
    setEtapa('excluindo')
    try {
      await excluirDadosDoUsuario(usuario.uid)
      await apagarConta(usuario)
    } catch (falha) {
      if (codigoDoErro(falha) === 'auth/requires-recent-login') {
        setEtapa('novo-login')
        return
      }
      console.error(falha)
      setErro('Não foi possível excluir. Verifique a internet e tente de novo.')
      setEtapa('confirmando')
    }
  }

  const entrarDeNovoEExcluir = async () => {
    setErro(null)
    try {
      await reauthenticateWithPopup(usuario, provedorGoogle, resolvedorLogin)
      setEtapa('excluindo')
      await apagarConta(usuario)
    } catch (falha) {
      console.error(falha)
      setErro(
        'Não foi possível confirmar o login. Se o navegador bloqueou a janela, permita e tente de novo.',
      )
      setEtapa('novo-login')
    }
  }

  return (
    <LayoutLogado>
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-extrabold">Minha conta</h1>

        <Card className="flex flex-wrap items-center gap-5">
          <FotoUsuario usuario={usuario} className="size-20 text-3xl" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xl font-extrabold">{usuario.displayName}</p>
            <p className="break-all text-tinta-suave">{usuario.email}</p>
          </div>
        </Card>

        <div>
          <Botao
            variante="secundario"
            disabled={saindo}
            onClick={() => {
              setSaindo(true)
              void sair()
            }}
          >
            {saindo ? 'Saindo…' : 'Sair'}
          </Botao>
        </div>

        <Card className="flex flex-col items-start gap-3 border-vermelho/30">
          <h2 className="text-xl font-extrabold">Excluir minha conta e todos os dados</h2>
          <p className="text-tinta-suave">
            Apaga todos os alunos, todo o histórico de atividades e a sua conta no EducAEE. Não pode
            ser desfeito.
          </p>
          <Botao
            variante="secundario"
            className="border-vermelho text-vermelho hover:bg-rosa"
            onClick={() => setEtapa('confirmando')}
          >
            Excluir minha conta
          </Botao>
        </Card>
      </div>

      <Modal
        aberto={etapa !== 'fechado'}
        titulo={etapa === 'novo-login' ? 'Falta só um passo' : 'Excluir conta e todos os dados?'}
        aoFechar={fechar}
        podeFechar={etapa !== 'excluindo'}
        acoes={
          etapa === 'novo-login' ? (
            <Botao onClick={() => void entrarDeNovoEExcluir()}>Entrar de novo e excluir</Botao>
          ) : (
            <>
              <Botao variante="secundario" onClick={fechar} disabled={etapa === 'excluindo'}>
                Cancelar
              </Botao>
              <Botao
                className="bg-vermelho hover:bg-vermelho/90"
                disabled={confirmacao.trim() !== PALAVRA_CONFIRMACAO || etapa === 'excluindo'}
                onClick={() => void excluir()}
              >
                {etapa === 'excluindo' ? 'Excluindo…' : 'Excluir tudo'}
              </Botao>
            </>
          )
        }
      >
        {etapa === 'novo-login' ? (
          <p>
            Os seus alunos e o histórico já foram apagados. Por segurança, o Google pede que você
            entre de novo para concluir a exclusão da conta.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p>
              Isso apaga todos os alunos, todo o histórico e a sua conta. Não pode ser desfeito.
            </p>
            <label htmlFor={idCampo} className="font-semibold">
              Para confirmar, digite {PALAVRA_CONFIRMACAO}:
            </label>
            <input
              id={idCampo}
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value.toUpperCase())}
              disabled={etapa === 'excluindo'}
              autoComplete="off"
              className="min-h-12 rounded-xl border-2 border-borda px-4 text-lg font-bold tracking-widest uppercase focus:border-azul"
            />
          </div>
        )}
        {erro && (
          <p role="alert" className="mt-3 font-semibold text-vermelho">
            {erro}
          </p>
        )}
      </Modal>
    </LayoutLogado>
  )
}
