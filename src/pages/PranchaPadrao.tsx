import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router'
import Botao from '../components/Botao'
import BotaoLink from '../components/BotaoLink'
import Figura from '../components/Figura'
import { useConvidado } from '../contexts/convidado-contexto'
import { useSessao } from '../contexts/sessao-contexto'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { PERFIL_PADRAO } from '../lib/perfil'
import Prancha from '../prancha/PranchaComunicacao'
import { montarPrancha } from '../prancha/prancha'
import { POR_TELA_PADRAO } from '../prancha/vocabulario'

// Só com login (e carregada sob demanda): o convidado nunca carrega o Firestore.
const EscolherAlunoPrancha = lazy(() => import('./EscolherAlunoPrancha'))

/** /prancha — a prancha padrão (também no modo convidado, sem personalizar nem salvar). */
export default function PranchaPadrao() {
  useTituloPagina('Prancha de comunicação')
  const { usuario } = useSessao()
  const convidado = useConvidado()
  const navigate = useNavigate()
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const cartoes = montarPrancha(null, [])
  const perfil = usuario ? PERFIL_PADRAO : convidado.perfil

  const baixar = async () => {
    setGerandoPdf(true)
    try {
      const { baixarPranchaPdf } = await import('../prancha/prancha-pdf')
      await baixarPranchaPdf(cartoes, null)
    } catch (falha) {
      console.error(falha)
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <Prancha
      titulo="Prancha de comunicação"
      cartoes={cartoes}
      porTela={POR_TELA_PADRAO}
      perfil={perfil}
      topo={
        <>
          <BotaoLink to={usuario ? '/painel' : '/convidado'} variante="secundario">
            <Figura nome="porta" alt="" className="size-6" />
            Voltar
          </BotaoLink>
          <Botao variante="secundario" onClick={() => void baixar()} disabled={gerandoPdf}>
            {gerandoPdf ? 'Gerando PDF…' : 'Baixar prancha (PDF)'}
          </Botao>
          {usuario && (
            <Suspense fallback={null}>
              <EscolherAlunoPrancha
                uid={usuario.uid}
                aoEscolher={(id) => void navigate(`/aluno/${id}/prancha`)}
              />
            </Suspense>
          )}
        </>
      }
    />
  )
}
