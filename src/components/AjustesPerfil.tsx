import { TEMAS_IDS, type Perfil } from '../lib/perfil'
import { TEMAS } from '../lib/temas'
import GrupoOpcoes from './GrupoOpcoes'

interface AjustesPerfilProps {
  perfil: Perfil
  aoMudar: (perfil: Perfil) => void
}

/** Todos os ajustes de acessibilidade e preferências do aluno (seção 5). */
export default function AjustesPerfil({ perfil, aoMudar }: AjustesPerfilProps) {
  const mudar = <C extends keyof Perfil>(campo: C, valor: Perfil[C]) =>
    aoMudar({ ...perfil, [campo]: valor })

  return (
    <div className="flex flex-col gap-6">
      <GrupoOpcoes
        legenda="Tamanho dos elementos"
        ajuda="Botões, cartas, alvos e textos nas atividades."
        opcoes={[
          { valor: 'normal', rotulo: 'Normal' },
          { valor: 'grande', rotulo: 'Grande' },
          { valor: 'muito_grande', rotulo: 'Muito grande' },
        ]}
        valor={perfil.tamanho}
        aoMudar={(valor) => mudar('tamanho', valor)}
      />
      <GrupoOpcoes
        legenda="Contraste"
        ajuda="Alto: fundo escuro, contornos grossos e cores bem fortes."
        opcoes={[
          { valor: 'normal', rotulo: 'Normal' },
          { valor: 'alto', rotulo: 'Alto' },
        ]}
        valor={perfil.contraste}
        aoMudar={(valor) => mudar('contraste', valor)}
      />
      <GrupoOpcoes
        legenda="Sons de acerto e erro"
        ajuda="Curtos e suaves. Não afeta a voz."
        opcoes={[
          { valor: true, rotulo: 'Ligados' },
          { valor: false, rotulo: 'Desligados' },
        ]}
        valor={perfil.sons}
        aoMudar={(valor) => mudar('sons', valor)}
      />
      <GrupoOpcoes
        legenda="Animações"
        ajuda="Reduzidas: sem movimento decorativo e alvos parados."
        opcoes={[
          { valor: false, rotulo: 'Normais' },
          { valor: true, rotulo: 'Reduzidas' },
        ]}
        valor={perfil.animacoesReduzidas}
        aoMudar={(valor) => mudar('animacoesReduzidas', valor)}
      />
      <GrupoOpcoes
        legenda="Leitura em voz alta"
        ajuda="Lê as instruções de cada jogada."
        opcoes={[
          { valor: true, rotulo: 'Ligada' },
          { valor: false, rotulo: 'Desligada' },
        ]}
        valor={perfil.leituraVoz}
        aoMudar={(valor) => mudar('leituraVoz', valor)}
      />
      <GrupoOpcoes
        legenda="Velocidade da voz"
        opcoes={[
          { valor: 'lenta', rotulo: 'Lenta' },
          { valor: 'normal', rotulo: 'Normal' },
        ]}
        valor={perfil.velocidadeVoz}
        aoMudar={(valor) => mudar('velocidadeVoz', valor)}
        desativado={!perfil.leituraVoz}
      />
      <GrupoOpcoes
        legenda="Tema de interesse"
        ajuda="Define as figuras usadas nas atividades."
        opcoes={TEMAS_IDS.map((tema) => ({
          valor: tema,
          rotulo: TEMAS[tema].nome,
          figura: TEMAS[tema].icone,
        }))}
        valor={perfil.tema}
        aoMudar={(valor) => mudar('tema', valor)}
      />
    </div>
  )
}
