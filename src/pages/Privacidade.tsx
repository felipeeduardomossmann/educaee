import LayoutPublico from '../components/LayoutPublico'
import { useTituloPagina } from '../hooks/useTituloPagina'

const EMAIL_CONTATO = 'felipeeduardomossmann@gmail.com'

export default function Privacidade() {
  useTituloPagina('Privacidade')

  return (
    <LayoutPublico>
      <article className="mx-auto flex max-w-3xl flex-col gap-8 text-lg leading-relaxed">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold">Política de privacidade</h1>
          <p className="text-tinta-suave">
            Em poucas palavras: guardamos só o necessário, só você vê, e você pode apagar tudo
            quando quiser.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">O que é salvo</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>O nome e o e-mail da sua conta Google.</li>
            <li>O nome ou apelido e a turma de cada aluno que você cadastrar.</li>
            <li>As preferências de cada aluno (tamanho, sons, voz, tema das figuras etc.).</li>
            <li>Os resultados das atividades: acertos, erros, nível, duração e data.</li>
            <li>A última análise de progresso de cada aluno, se você gerar uma.</li>
            <li>A lista de vídeos do YouTube que você escondeu.</li>
            <li>
              Os cartões que você criar para a prancha de comunicação (palavra, figura e fala) e a
              configuração da prancha de cada aluno.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Onde ficam os dados</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              <strong>Onde são guardados:</strong> no banco de dados do Google (Firebase), em
              servidores em São Paulo, no Brasil.
            </li>
            <li>
              <strong>Por onde passam:</strong> os recursos que precisam de um servidor (desenhos,
              análise do progresso, vídeos, cartões da prancha e transferência de aluno) rodam na
              Vercel, em servidores em São Paulo, no Brasil. Eles só atendem o pedido na hora e não
              guardam nada.
            </li>
            <li>
              <strong>Inteligência artificial e vídeos:</strong> nos desenhos, na análise, nos
              cartões da prancha e na busca de vídeos, enviamos ao Google (Gemini e YouTube) só o
              necessário para cada pedido, como explicado abaixo. Esses serviços podem processar os
              dados fora do Brasil.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Quem vê</h2>
          <p>Só você. Cada conta enxerga apenas os próprios alunos e resultados.</p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Desenhos para colorir</h2>
          <p>
            O tema que você digita é enviado à inteligência artificial do Google (Gemini) para criar
            os desenhos. Não enviamos seu nome, e-mail nem dados dos alunos. No serviço pago que
            usamos, o Google não usa esse conteúdo para treinar os modelos dele.
          </p>
          <p>
            Os desenhos não são guardados: aparecem só na sua tela. Guardamos apenas quantos
            desenhos foram criados em cada dia e mês, para controlar os limites de uso, com um
            código no lugar da sua conta.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Análise do progresso</h2>
          <p>
            Para gerar a análise, o site usa apenas números de desempenho: para cada atividade, o
            nível, as datas das rodadas e a porcentagem de acertos. Nosso servidor transforma esses
            números num resumo (médias, níveis, frequência e se o acerto subiu ou caiu) e só esse
            resumo vai para o Google Gemini. Não enviamos o nome, a turma nem qualquer dado que
            identifique o aluno ou você. O nome do aluno só entra no texto depois, na sua tela.
          </p>
          <p>
            A análise fica salva no cadastro do aluno (só você vê) até você gerar outra ou excluir o
            aluno. Também guardamos quantas análises foram feitas por dia, para o limite de uso, com
            um código no lugar da sua conta.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Vídeos</h2>
          <p>
            A busca de vídeos usa os serviços de API do YouTube. O termo que você busca é enviado ao
            YouTube (Google) e, junto com os títulos e descrições dos vídeos encontrados, à
            inteligência artificial do Google (Gemini), para tirar o que não for adequado para
            crianças. Não enviamos seu nome, e-mail nem dados dos alunos.
          </p>
          <p>
            Os vídeos aparecem no player do YouTube em modo de privacidade aprimorada
            (youtube-nocookie.com), e as miniaturas vêm dos servidores do YouTube. Não guardamos
            histórico de buscas: guardamos só quantas buscas foram feitas por dia (com um código no
            lugar da sua conta) e, por 24 horas, os resultados de cada termo, sem dizer quem buscou.
          </p>
          <p>
            Ao assistir aos vídeos, você concorda com os{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-azul-escuro underline underline-offset-2"
            >
              Termos de Serviço do YouTube
            </a>
            . O uso de dados pelo Google segue a{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-azul-escuro underline underline-offset-2"
            >
              Política de Privacidade do Google
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Prancha de comunicação</h2>
          <p>
            Para criar um cartão próprio, a palavra que você digita é enviada à inteligência
            artificial do Google (Gemini), que desenha duas opções de figura e grava a fala da
            palavra. A figura escolhida e a fala ficam salvas na sua conta, para usar com os seus
            alunos. Não enviamos seu nome, e-mail nem dados dos alunos. As figuras criadas contam no
            mesmo limite de uso dos desenhos.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Transferência de aluno</h2>
          <p>
            Quando você gera um código de transferência, quem digitar esse código no EducAEE recebe
            uma cópia do aluno: nome, turma, ajustes, níveis, todas as rodadas, a última análise, a
            prancha e os cartões próprios usados nela. Antes de confirmar, a pessoa vê o nome e a
            turma do aluno, o seu primeiro nome e o número de rodadas.
          </p>
          <p>
            O código vale por 7 dias e só pode ser usado uma vez; você pode cancelá-lo antes. Só
            passe o código para quem vai assumir o aluno. Se você marcar a opção, o aluno é removido
            da sua conta quando for recebido; senão, ele continua com você também. Guardamos só o
            necessário para o código funcionar, e ele é apagado depois de usado.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">O que não fazemos</h2>
          <p>
            Não mostramos propaganda, não usamos ferramentas de rastreamento nem de análise de
            visitas e não vendemos nem compartilhamos dados com ninguém.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Use um apelido</h2>
          <p>
            Para proteger a privacidade dos alunos, recomendamos cadastrar só o primeiro nome ou um
            apelido, sem sobrenome.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Como excluir</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              <strong>Um aluno:</strong> no painel, abra o menu do aluno e escolha “Excluir”. Isso
              apaga o aluno e todo o histórico dele.
            </li>
            <li>
              <strong>Tudo:</strong> em “Minha conta”, escolha “Excluir minha conta e todos os
              dados”. Isso apaga todos os alunos, todos os resultados e a sua conta.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Modo convidado</h2>
          <p>
            Usando sem conta, nada é salvo: nem na internet, nem no navegador. Ao fechar ou
            recarregar a página, tudo se perde. A única coisa que o navegador guarda é a escolha do
            tema da tela (claro, escuro ou automático), que vale para qualquer pessoa que usar
            aquele aparelho.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Contato</h2>
          <p>
            Dúvidas ou pedidos sobre os seus dados:{' '}
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="font-semibold break-all text-azul underline underline-offset-2 hover:text-azul-escuro"
            >
              {EMAIL_CONTATO}
            </a>
            .
          </p>
        </section>
      </article>
    </LayoutPublico>
  )
}
