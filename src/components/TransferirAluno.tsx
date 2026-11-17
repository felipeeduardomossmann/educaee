import { useEffect, useId, useState } from 'react'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import type { Aluno } from '../lib/aluno'
import {
  cancelarCodigo,
  gerarCodigo,
  listarCodigos,
  MENSAGENS_TRANSFERENCIA,
  type CodigoAtivo,
  type CodigoErroTransferencia,
} from '../lib/transferencia'
import Botao from './Botao'
import Modal from './Modal'

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** "Transferir / compartilhar": gera um código para outra professora receber o aluno. */
export default function TransferirAluno({
  aluno,
  aoFechar,
}: {
  aluno: Aluno
  aoFechar: () => void
}) {
  const usuario = useUsuarioLogado()
  const idRemover = useId()
  const [remover, setRemover] = useState(false)
  const [novo, setNovo] = useState<{ codigo: string; expiraEm: number } | null>(null)
  const [ativos, setAtivos] = useState<CodigoAtivo[] | null>(null)
  const [erro, setErro] = useState<CodigoErroTransferencia | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const atualizar = async () => {
    const r = await listarCodigos(usuario, aluno.id)
    setAtivos(r.ok ? r.codigos : [])
  }
  useEffect(() => {
    let ativo = true
    void listarCodigos(usuario, aluno.id).then((r) => ativo && setAtivos(r.ok ? r.codigos : []))
    return () => {
      ativo = false
    }
  }, [usuario, aluno.id])

  const gerar = async () => {
    setOcupado(true)
    setErro(null)
    setCopiado(false)
    const r = await gerarCodigo(usuario, aluno.id, remover)
    if (r.ok) {
      setNovo({ codigo: r.codigo, expiraEm: r.expiraEm })
      await atualizar()
    } else setErro(r.codigo)
    setOcupado(false)
  }

  const cancelar = async (codigo: string) => {
    await cancelarCodigo(usuario, codigo)
    if (novo?.codigo === codigo) setNovo(null)
    await atualizar()
  }

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Modal
      aberto
      titulo={`Transferir ${aluno.nome}`}
      aoFechar={aoFechar}
      acoes={<Botao onClick={aoFechar}>Fechar</Botao>}
    >
      <div className="flex flex-col gap-4">
        <p>
          Gere um código e passe para a outra professora. No EducAEE dela, em “Receber aluno”, ela
          digita o código e recebe {aluno.nome} com todo o histórico. O código vale por 7 dias e só
          pode ser usado uma vez.
        </p>
        <label htmlFor={idRemover} className="flex cursor-pointer items-start gap-3">
          <input
            id={idRemover}
            type="checkbox"
            checked={remover}
            onChange={(e) => setRemover(e.target.checked)}
            className="mt-1 size-5 accent-azul"
          />
          <span>Remover {aluno.nome} da minha conta depois que for recebido</span>
        </label>
        <Botao onClick={() => void gerar()} disabled={ocupado} className="self-start">
          {ocupado ? 'Gerando…' : 'Gerar código'}
        </Botao>
        {erro && (
          <p role="alert" className="rounded-2xl bg-rosa px-4 py-3 font-semibold">
            {MENSAGENS_TRANSFERENCIA[erro]}
          </p>
        )}
        {novo && (
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-sol p-4">
            <p className="font-bold">Código para {aluno.nome}:</p>
            <p
              className="font-mono text-4xl font-extrabold tracking-[0.3em]"
              aria-label={[...novo.codigo].join(' ')}
            >
              {novo.codigo}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Botao variante="secundario" onClick={() => void copiar(novo.codigo)}>
                Copiar código
              </Botao>
              <span role="status" className="font-semibold">
                {copiado ? 'Copiado!' : ''}
              </span>
            </div>
            <p className="text-sm">Vale até {formatoData.format(novo.expiraEm)}.</p>
          </div>
        )}
        <section aria-labelledby="titulo-ativos" className="flex flex-col gap-2">
          <h3 id="titulo-ativos" className="text-lg font-extrabold">
            Códigos ativos
          </h3>
          {ativos === null ? (
            <p className="text-tinta-suave">Carregando…</p>
          ) : ativos.length === 0 ? (
            <p className="text-tinta-suave">Nenhum código ativo para {aluno.nome}.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ativos.map((c) => (
                <li
                  key={c.codigo}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borda px-3 py-2"
                >
                  <span>
                    <span className="font-mono text-lg font-bold tracking-widest">{c.codigo}</span>
                    <span className="text-sm text-tinta-suave">
                      {' '}
                      · até {formatoData.format(c.expiraEm)}
                      {c.remover ? ' · remove daqui ao ser recebido' : ''}
                    </span>
                  </span>
                  <Botao variante="suave" onClick={() => void cancelar(c.codigo)}>
                    Cancelar
                  </Botao>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  )
}
