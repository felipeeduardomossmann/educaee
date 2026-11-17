import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import AjustesPerfil from '../components/AjustesPerfil'
import Botao from '../components/Botao'
import BotaoLink from '../components/BotaoLink'
import Card from '../components/Card'
import ConfirmarExclusaoAluno from '../components/ConfirmarExclusaoAluno'
import LayoutLogado from '../components/LayoutLogado'
import PreviaPerfil from '../components/PreviaPerfil'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useAlunos } from '../hooks/useAlunos'
import { useTituloPagina } from '../hooks/useTituloPagina'
import {
  LIMITE_NOME,
  LIMITE_TURMA,
  limparDadosAluno,
  listarTurmas,
  validarDadosAluno,
  type DadosAluno,
  type ErrosAluno,
} from '../lib/aluno'
import { atualizarAluno, criarAluno, lerAluno } from '../lib/alunos'
import { PERFIL_PADRAO } from '../lib/perfil'

type Carga = 'carregando' | 'pronto' | 'nao-encontrado' | 'erro'

const classeCampo =
  'min-h-12 w-full rounded-xl border-2 border-borda bg-white px-4 text-lg focus:border-azul aria-[invalid=true]:border-vermelho'

export default function AlunoFormulario() {
  const { id } = useParams()
  const editando = id !== undefined
  useTituloPagina(editando ? 'Editar aluno' : 'Novo aluno')

  const usuario = useUsuarioLogado()
  const navigate = useNavigate()
  const { alunos } = useAlunos(usuario.uid)
  const turmasExistentes = listarTurmas(alunos)

  const [dados, setDados] = useState<DadosAluno>({ nome: '', turma: '', perfil: PERFIL_PADRAO })
  const [nomeOriginal, setNomeOriginal] = useState('')
  const [carga, setCarga] = useState<Carga>(editando ? 'carregando' : 'pronto')
  const [erros, setErros] = useState<ErrosAluno>({})
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const campoNome = useRef<HTMLInputElement>(null)
  const campoTurma = useRef<HTMLInputElement>(null)
  const ids = { nome: useId(), turma: useId(), ajudaNome: useId(), turmas: useId() }

  useEffect(() => {
    if (!id) return
    let ativo = true
    lerAluno(usuario.uid, id)
      .then((aluno) => {
        if (!ativo) return
        if (!aluno) {
          setCarga('nao-encontrado')
          return
        }
        setDados({ nome: aluno.nome, turma: aluno.turma, perfil: aluno.perfil })
        setNomeOriginal(aluno.nome)
        setCarga('pronto')
      })
      .catch((falha: unknown) => {
        console.error(falha)
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [id, usuario.uid])

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    setErroSalvar(null)
    const limpos = limparDadosAluno(dados)
    const novosErros = validarDadosAluno(limpos)
    setErros(novosErros)
    if (novosErros.nome) return campoNome.current?.focus()
    if (novosErros.turma) return campoTurma.current?.focus()

    setSalvando(true)
    const gravacao = id ? atualizarAluno(usuario.uid, id, limpos) : criarAluno(usuario.uid, limpos)
    if (navigator.onLine) {
      try {
        await gravacao
      } catch (falha) {
        console.error(falha)
        setErroSalvar('Não foi possível salvar. Verifique a internet e tente de novo.')
        setSalvando(false)
        return
      }
    } else {
      // Offline: fica salvo neste navegador e é enviado quando a internet voltar.
      gravacao.catch((falha: unknown) => console.error(falha))
    }
    await navigate('/painel')
  }

  if (carga !== 'pronto') {
    return (
      <LayoutLogado>
        {carga === 'carregando' ? (
          <p role="status" className="text-lg text-tinta-suave">
            Carregando…
          </p>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-xl font-bold">
              {carga === 'nao-encontrado'
                ? 'Aluno não encontrado. Ele pode ter sido excluído.'
                : 'Não foi possível carregar o aluno. Verifique a internet e tente de novo.'}
            </p>
            <BotaoLink to="/painel">Voltar para meus alunos</BotaoLink>
          </div>
        )}
      </LayoutLogado>
    )
  }

  return (
    <LayoutLogado>
      <form onSubmit={(evento) => void salvar(evento)} noValidate className="flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold">
          {editando ? `Editar ${nomeOriginal}` : 'Novo aluno'}
        </h1>

        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.nome} className="text-lg font-extrabold">
              Nome ou apelido
            </label>
            <p id={ids.ajudaNome} className="text-tinta-suave">
              Para proteger a privacidade, use só o primeiro nome ou um apelido.
            </p>
            <input
              ref={campoNome}
              id={ids.nome}
              value={dados.nome}
              onChange={(evento) => setDados({ ...dados, nome: evento.target.value })}
              maxLength={LIMITE_NOME}
              required
              autoComplete="off"
              aria-invalid={erros.nome ? true : undefined}
              aria-describedby={ids.ajudaNome}
              aria-errormessage={erros.nome ? `${ids.nome}-erro` : undefined}
              className={classeCampo}
            />
            {erros.nome && (
              <p id={`${ids.nome}-erro`} className="font-semibold text-vermelho">
                {erros.nome}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={ids.turma} className="text-lg font-extrabold">
              Turma <span className="font-semibold text-tinta-suave">(opcional)</span>
            </label>
            <input
              ref={campoTurma}
              id={ids.turma}
              value={dados.turma}
              onChange={(evento) => setDados({ ...dados, turma: evento.target.value })}
              maxLength={LIMITE_TURMA}
              placeholder="Ex.: 3º ano B"
              autoComplete="off"
              list={ids.turmas}
              aria-invalid={erros.turma ? true : undefined}
              aria-errormessage={erros.turma ? `${ids.turma}-erro` : undefined}
              className={`${classeCampo} sm:max-w-sm`}
            />
            <datalist id={ids.turmas}>
              {turmasExistentes.map((turma) => (
                <option key={turma} value={turma} />
              ))}
            </datalist>
            {erros.turma && (
              <p id={`${ids.turma}-erro`} className="font-semibold text-vermelho">
                {erros.turma}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-6">
          <h2 className="text-2xl font-extrabold">Ajustes de acessibilidade e preferências</h2>
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <AjustesPerfil
              perfil={dados.perfil}
              aoMudar={(perfil) => setDados({ ...dados, perfil })}
            />
            <div className="lg:sticky lg:top-6 lg:self-start">
              <PreviaPerfil perfil={dados.perfil} />
            </div>
          </div>
        </Card>

        {erroSalvar && (
          <p role="alert" className="rounded-2xl bg-rosa px-5 py-4 text-lg font-semibold">
            {erroSalvar}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" tamanho="grande" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
          <BotaoLink to="/painel" variante="secundario" tamanho="grande">
            Cancelar
          </BotaoLink>
          {editando && (
            <Botao
              variante="suave"
              className="ml-auto text-vermelho hover:bg-rosa"
              onClick={() => setConfirmandoExclusao(true)}
            >
              Excluir aluno
            </Botao>
          )}
        </div>
      </form>

      {id && (
        <ConfirmarExclusaoAluno
          aluno={confirmandoExclusao ? { id, nome: nomeOriginal } : null}
          aoFechar={() => setConfirmandoExclusao(false)}
          aoExcluir={() => void navigate('/painel')}
        />
      )}
    </LayoutLogado>
  )
}
