import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import {
  formatarCodigoDigitado,
  MENSAGENS_TRANSFERENCIA,
  receberAluno,
  verPrevia,
  type CodigoErroTransferencia,
  type PreviaAluno,
} from '../lib/transferencia'
import Botao from './Botao'
import Modal from './Modal'

/** "Receber aluno": digitar o código, ver a prévia e confirmar. */
export default function ReceberAluno({ aoFechar }: { aoFechar: () => void }) {
  const usuario = useUsuarioLogado()
  const navigate = useNavigate()
  const idCodigo = useId()
  const [codigo, setCodigo] = useState('')
  const [previa, setPrevia] = useState<PreviaAluno | null>(null)
  const [erro, setErro] = useState<CodigoErroTransferencia | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const ver = async () => {
    setOcupado(true)
    setErro(null)
    const r = await verPrevia(usuario, codigo)
    if (r.ok)
      setPrevia({ nome: r.nome, turma: r.turma, remetente: r.remetente, rodadas: r.rodadas })
    else setErro(r.codigo)
    setOcupado(false)
  }

  const receber = async () => {
    setOcupado(true)
    setErro(null)
    const r = await receberAluno(usuario, codigo)
    setOcupado(false)
    if (!r.ok) {
      setErro(r.codigo)
      return
    }
    aoFechar()
    void navigate(`/aluno/${r.alunoId}/progresso`)
  }

  return (
    <Modal
      aberto
      titulo="Receber aluno"
      aoFechar={aoFechar}
      podeFechar={!ocupado}
      acoes={
        <>
          <Botao variante="secundario" onClick={aoFechar} disabled={ocupado}>
            Cancelar
          </Botao>
          {previa ? (
            <Botao onClick={() => void receber()} disabled={ocupado}>
              {ocupado ? 'Recebendo…' : 'Receber aluno'}
            </Botao>
          ) : (
            <Botao onClick={() => void ver()} disabled={ocupado || codigo.length !== 6}>
              {ocupado ? 'Conferindo…' : 'Ver aluno'}
            </Botao>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label htmlFor={idCodigo} className="flex flex-col gap-1 font-bold">
          Código recebido (6 letras e números)
          <input
            id={idCodigo}
            value={codigo}
            onChange={(e) => {
              setCodigo(formatarCodigoDigitado(e.target.value))
              setPrevia(null)
            }}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            className="min-h-14 rounded-2xl border-2 border-borda bg-white px-4 font-mono text-3xl font-normal tracking-[0.3em] uppercase"
          />
        </label>
        {erro && (
          <p role="alert" className="rounded-2xl bg-rosa px-4 py-3 font-semibold">
            {MENSAGENS_TRANSFERENCIA[erro]}
          </p>
        )}
        {previa && (
          <p role="status" className="rounded-2xl bg-menta px-4 py-3 text-lg">
            <strong>
              {previa.nome}
              {previa.turma ? ` – ${previa.turma}` : ''}
            </strong>
            , enviado por {previa.remetente}, {previa.rodadas}{' '}
            {previa.rodadas === 1 ? 'rodada' : 'rodadas'}. O aluno chega com o perfil, os níveis,
            todas as rodadas, a última análise e a prancha.
          </p>
        )}
      </div>
    </Modal>
  )
}
