import { useState } from 'react'
import { useParams } from 'react-router'
import Botao from '../components/Botao'
import BotaoLink from '../components/BotaoLink'
import Carregando from '../components/Carregando'
import Figura from '../components/Figura'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAluno } from '../hooks/useAluno'
import { useTituloPagina } from '../hooks/useTituloPagina'
import { useCartoesProprios } from '../hooks/useCartoesProprios'
import Prancha from '../prancha/PranchaComunicacao'
import { montarPrancha } from '../prancha/prancha'
import { POR_TELA_PADRAO } from '../prancha/vocabulario'

/** /aluno/:id/prancha — a prancha personalizada do aluno. */
export default function PranchaAluno() {
  const { id = null } = useParams()
  const usuario = useUsuarioLogado()
  const estado = useAluno(usuario.uid, id)
  const proprios = useCartoesProprios(usuario.uid)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  useTituloPagina(estado.situacao === 'pronto' ? `Prancha de ${estado.aluno.nome}` : 'Prancha')

  if (estado.situacao === 'carregando' || proprios === null) return <Carregando />
  if (estado.situacao !== 'pronto') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p role="alert" className="text-xl font-bold">
          Não foi possível abrir a prancha.
        </p>
        <BotaoLink to="/painel">Voltar para meus alunos</BotaoLink>
      </main>
    )
  }
  const { aluno } = estado
  const cartoes = montarPrancha(aluno.prancha ?? null, proprios)

  const baixar = async () => {
    setGerandoPdf(true)
    try {
      const { baixarPranchaPdf } = await import('../prancha/prancha-pdf')
      await baixarPranchaPdf(cartoes, aluno.nome)
    } catch (falha) {
      console.error(falha)
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <Prancha
      titulo={`Prancha de ${aluno.nome}`}
      cartoes={cartoes}
      porTela={aluno.prancha?.porTela ?? POR_TELA_PADRAO}
      perfil={aluno.perfil}
      topo={
        <>
          <BotaoLink to={`/aluno/${aluno.id}/atividades`} variante="secundario">
            <Figura nome="porta" alt="" className="size-6" />
            Voltar
          </BotaoLink>
          <BotaoLink to={`/aluno/${aluno.id}/prancha/editar`} variante="secundario">
            <Figura nome="engrenagem" alt="" className="size-6" />
            Personalizar
          </BotaoLink>
          <Botao variante="secundario" onClick={() => void baixar()} disabled={gerandoPdf}>
            {gerandoPdf ? 'Gerando PDF…' : 'Baixar prancha (PDF)'}
          </Botao>
        </>
      }
    />
  )
}
