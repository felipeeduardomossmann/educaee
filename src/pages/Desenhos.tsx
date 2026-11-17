import { useEffect, useId, useState, type FormEvent } from 'react'
import Botao from '../components/Botao'
import Card from '../components/Card'
import Figura from '../components/Figura'
import LayoutLogado from '../components/LayoutLogado'
import { useUsuarioLogado } from '../contexts/sessao-contexto'
import { useOnline } from '../hooks/useOnline'
import { useTituloPagina } from '../hooks/useTituloPagina'
import {
  baixarPng,
  consultarRestantes,
  DESENHOS_POR_PEDIDO,
  gerarDesenho,
  imprimirDesenho,
  MENSAGENS_ERRO,
  TAMANHO_MAXIMO_TEMA,
  type CodigoErroDesenho,
  type Restantes,
} from '../lib/desenhos'

type Desenho =
  | { estado: 'gerando' }
  | { estado: 'pronto'; imagem: string }
  | { estado: 'erro'; codigo: CodigoErroDesenho }

interface Pedido {
  tema: string
  desenhos: Desenho[]
}

// Os desenhos ficam só na memória desta visita (sair da tela e voltar não os perde; recarregar
// a página, sim). Nada vai para o banco.
let pedidoGuardado: Pedido | null = null

function textoRestantes(restantes: Restantes): string {
  if (restantes.restamHoje === 0) {
    return restantes.limitadoPeloMes ? MENSAGENS_ERRO['limite-mes'] : MENSAGENS_ERRO['limite-dia']
  }
  const n = restantes.restamHoje
  return `${n === 1 ? 'Resta 1 desenho' : `Restam ${n} desenhos`} hoje.`
}

export default function Desenhos() {
  useTituloPagina('Desenhos para colorir')
  const usuario = useUsuarioLogado()
  const online = useOnline()
  const idCampo = useId()
  const idAjuda = useId()
  const [tema, setTema] = useState(pedidoGuardado?.tema ?? '')
  const [pedido, setPedido] = useState<Pedido | null>(pedidoGuardado)
  const [restantes, setRestantes] = useState<Restantes | null>(null)

  useEffect(() => {
    pedidoGuardado = pedido
  }, [pedido])

  useEffect(() => {
    if (!online) return
    let ativo = true
    void consultarRestantes(usuario).then((valor) => {
      if (ativo && valor) setRestantes(valor)
    })
    return () => {
      ativo = false
    }
  }, [usuario, online])

  const gerando = pedido?.desenhos.some((d) => d.estado === 'gerando') ?? false
  const semSaldo = restantes?.restamHoje === 0
  const temaLimpo = tema.trim()

  const gerar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!temaLimpo || gerando || semSaldo || !online) return
    const quantidade = Math.min(DESENHOS_POR_PEDIDO, restantes?.restamHoje ?? DESENHOS_POR_PEDIDO)
    const temaPedido = temaLimpo
    setPedido({
      tema: temaPedido,
      desenhos: Array.from({ length: quantidade }, () => ({ estado: 'gerando' })),
    })
    // Uma chamada por desenho, em paralelo (cada chamada da IA gera 1 imagem). As respostas
    // chegam fora de ordem, então o "quantos restam" é conferido no servidor no fim.
    let pendentes = quantidade
    let ultimoRestantes: Restantes | undefined
    for (let i = 0; i < quantidade; i++) {
      void gerarDesenho(usuario, temaPedido).then((resultado) => {
        ultimoRestantes = resultado.restantes ?? ultimoRestantes
        pendentes -= 1
        if (pendentes === 0) {
          void consultarRestantes(usuario).then((valor) => {
            const final = valor ?? ultimoRestantes
            if (final) setRestantes(final)
          })
        }
        const desenho: Desenho = resultado.ok
          ? { estado: 'pronto', imagem: resultado.imagem }
          : { estado: 'erro', codigo: resultado.codigo }
        setPedido((atual) =>
          atual && atual.tema === temaPedido
            ? { ...atual, desenhos: atual.desenhos.map((d, j) => (j === i ? desenho : d)) }
            : atual,
        )
      })
    }
  }

  const prontos = pedido?.desenhos.filter((d) => d.estado === 'pronto').length ?? 0
  const anuncio = !pedido
    ? ''
    : gerando
      ? 'Criando os desenhos. Isso leva uns 20 segundos.'
      : prontos > 0
        ? `Pronto! ${prontos === 1 ? '1 desenho criado' : `${prontos} desenhos criados`}.`
        : ''

  return (
    <LayoutLogado>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Figura nome="giz-de-cera" alt="" className="size-14 shrink-0" />
          <div>
            <h1 className="text-3xl font-extrabold">Desenhos para colorir</h1>
            <p className="text-lg text-tinta-suave">
              Escreva um tema e o EducAEE cria desenhos de contorno para imprimir e colorir.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={gerar} className="flex flex-col gap-3">
            <label htmlFor={idCampo} className="text-lg font-bold">
              Tema do desenho
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id={idCampo}
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                maxLength={TAMANHO_MAXIMO_TEMA}
                placeholder="Ex.: dinossauros na lua"
                aria-describedby={idAjuda}
                autoComplete="off"
                className="min-h-12 flex-1 rounded-2xl border-2 border-borda bg-white px-4 text-lg focus:border-azul"
              />
              <Botao
                type="submit"
                disabled={!temaLimpo || gerando || semSaldo || !online}
                className="sm:w-40"
              >
                {gerando ? 'Criando…' : 'Gerar'}
              </Botao>
            </div>
            <div
              id={idAjuda}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-tinta-suave"
            >
              <span>
                {!online
                  ? 'Sem internet: para criar desenhos, é preciso estar conectado.'
                  : restantes
                    ? textoRestantes(restantes)
                    : `Cada pedido cria ${DESENHOS_POR_PEDIDO} desenhos.`}
              </span>
              <span aria-hidden="true">
                {tema.length}/{TAMANHO_MAXIMO_TEMA}
              </span>
            </div>
          </form>
        </Card>

        <p role="status" className="sr-only">
          {anuncio}
        </p>

        {pedido && (
          <section aria-label={`Desenhos de "${pedido.tema}"`} className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold">“{pedido.tema}”</h2>
            <ul className="grid gap-6 sm:grid-cols-2">
              {pedido.desenhos.map((desenho, i) => (
                <li key={i}>
                  <CartaoDesenho
                    desenho={desenho}
                    tema={pedido.tema}
                    numero={i + 1}
                    total={pedido.desenhos.length}
                  />
                </li>
              ))}
            </ul>
            <p className="text-sm text-tinta-suave">
              Os desenhos não ficam salvos: imprima ou baixe os que quiser guardar.
            </p>
          </section>
        )}
      </div>
    </LayoutLogado>
  )
}

function CartaoDesenho({
  desenho,
  tema,
  numero,
  total,
}: {
  desenho: Desenho
  tema: string
  numero: number
  total: number
}) {
  const [ocupado, setOcupado] = useState(false)
  const descricao = `Desenho para colorir: ${tema} (${numero} de ${total})`

  const agir = (acao: () => Promise<void>) => {
    setOcupado(true)
    acao()
      .catch((erro: unknown) => console.warn(erro))
      .finally(() => setOcupado(false))
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-borda bg-white p-4 shadow-suave">
      <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-borda bg-white">
        {desenho.estado === 'pronto' ? (
          <img src={desenho.imagem} alt={descricao} className="size-full object-contain" />
        ) : desenho.estado === 'gerando' ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center text-tinta-suave">
            <Figura nome="giz-de-cera" alt="" className="size-16" />
            <p className="text-lg font-bold">Desenhando…</p>
          </div>
        ) : (
          <p role="alert" className="px-6 text-center text-lg font-semibold">
            {MENSAGENS_ERRO[desenho.codigo]}
          </p>
        )}
      </div>
      {desenho.estado === 'pronto' && (
        <div className="grid grid-cols-2 gap-3">
          <Botao
            variante="secundario"
            disabled={ocupado}
            onClick={() => agir(() => imprimirDesenho(desenho.imagem, descricao))}
            aria-label={`Imprimir desenho ${numero}`}
          >
            <Figura nome="impressora" alt="" className="size-6" />
            Imprimir
          </Botao>
          <Botao
            variante="secundario"
            disabled={ocupado}
            onClick={() => agir(() => baixarPng(desenho.imagem, tema, numero))}
            aria-label={`Baixar desenho ${numero} (PNG)`}
          >
            <Figura nome="baixar" alt="" className="size-6" />
            Baixar
          </Botao>
        </div>
      )}
    </div>
  )
}
