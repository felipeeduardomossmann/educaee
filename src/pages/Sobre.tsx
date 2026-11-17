import LayoutPublico from '../components/LayoutPublico'
import { useTituloPagina } from '../hooks/useTituloPagina'

const classeLink = 'font-semibold text-azul underline underline-offset-2 hover:text-azul-escuro'

export default function Sobre() {
  useTituloPagina('Sobre')

  return (
    <LayoutPublico>
      <article className="mx-auto flex max-w-3xl flex-col gap-8 text-lg leading-relaxed">
        <h1 className="text-4xl font-extrabold">Sobre o EducAEE</h1>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">O que é</h2>
          <p>
            O EducAEE é uma plataforma gratuita, sem propaganda e em português com atividades
            educativas adaptáveis para o Atendimento Educacional Especializado (AEE): o atendimento
            a alunos com deficiência, Transtorno do Espectro Autista (TEA) e outras necessidades
            específicas.
          </p>
          <p>
            Cada aluno tem um perfil próprio: tamanho dos elementos, contraste, sons, animações,
            leitura em voz alta e tema das figuras. As atividades se ajustam a esse perfil, nunca
            têm tempo limite e registram os resultados para acompanhar a evolução.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Para quem é</h2>
          <p>
            Para professoras, professores e monitores do AEE, que cadastram os alunos, escolhem as
            atividades e acompanham o progresso. E para os alunos, que jogam sempre com a mediação
            de um adulto.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Créditos</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              Figuras:{' '}
              <a
                href="https://github.com/microsoft/fluentui-emoji"
                className={classeLink}
                rel="noreferrer"
                target="_blank"
              >
                Fluent Emoji
              </a>{' '}
              (estilo Flat), da Microsoft, sob a licença MIT.
            </li>
            <li>
              Fonte:{' '}
              <a
                href="https://fonts.google.com/specimen/Nunito"
                className={classeLink}
                rel="noreferrer"
                target="_blank"
              >
                Nunito
              </a>
              , de Vernon Adams, Cyreal e Jacques Le Bailly, sob a SIL Open Font License 1.1.
            </li>
          </ul>
        </section>
      </article>
    </LayoutPublico>
  )
}
