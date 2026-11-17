# EducAEE

Plataforma web com atividades educativas adaptáveis para o Atendimento Educacional
Especializado (AEE). É gratuita, sem anúncios próprios e em português do Brasil. Desenvolvida como
trabalho de conclusão de curso em Ciência da Computação.

- Site: https://educaee.com.br
- Especificação: [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md)
- Créditos e licenças de terceiros: [`docs/CREDITOS.md`](docs/CREDITOS.md)

## O que tem

- Login do profissional com conta Google; cadastro de alunos com um perfil de acessibilidade
  (tamanho dos elementos, contraste, sons, animações, leitura em voz alta e tema das figuras).
- 16 atividades em 7 habilidades, cada uma com 4 níveis, e sugestão de nível ao fim da rodada
  (o profissional aceita ou não).
- Trilha do dia, prancha de comunicação alternativa, tela de progresso com gráficos, análise
  gerada por IA e relatório em PDF.
- Desenhos para colorir gerados por IA, busca de vídeos infantis e transferência de aluno entre
  profissionais por código.
- Modo convidado: as atividades funcionam sem login, mas nada é salvo.
- Funciona como PWA; depois do primeiro acesso, as atividades abrem sem internet.

## Tecnologias

- **Interface:** React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, React Router 8,
  Recharts 3, jsPDF.
- **PWA:** vite-plugin-pwa (Workbox).
- **Dados e login:** Firebase Authentication (Google) e Cloud Firestore.
- **Servidor:** funções serverless da Vercel (Node.js 24) em `api/`, com Firebase Admin SDK e
  verificação do token com `jose`.
- **Serviços externos:** API Gemini (análise, desenhos, pictogramas e falas gravadas) e YouTube
  Data API v3.
- **Qualidade:** Vitest, ESLint e Prettier.

## Como rodar localmente

Pré-requisitos: Node.js 24 e npm.

```bash
git clone https://github.com/felipeeduardomossmann/educaee.git
cd educaee
npm install
cp .env.example .env.local
npm run dev
```

O site abre em http://localhost:5173. No `.env.local`, preencha as variáveis `VITE_FIREBASE_*`
com os dados do app da Web no Firebase (Configurações do projeto → Seus apps). Elas são
públicas e vão para o navegador.

As funções de `api/` também rodam no `npm run dev` e precisam de mais três variáveis no
`.env.local`, que ficam só no servidor:

| Variável                   | Uso                                     |
| -------------------------- | --------------------------------------- |
| `GEMINI_API_KEY`           | Análise, desenhos, pictogramas e filtro |
| `YOUTUBE_API_KEY`          | Busca de vídeos                         |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço (SDK Admin)    |

Sem elas, o modo convidado e as atividades funcionam; os recursos com IA, os vídeos e a
transferência não.

| Comando           | O que faz                                  |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento                |
| `npm run build`   | Verifica os tipos e gera o site em `dist/` |
| `npm run preview` | Serve o build localmente                   |
| `npm test`        | Testes (Vitest)                            |
| `npm run lint`    | ESLint                                     |
| `npm run format`  | Prettier                                   |

As regras de segurança do banco estão em [`firestore.rules`](firestore.rules) e são publicadas
pelo console do Firebase ou com `firebase deploy --only firestore:rules`.

## Estrutura de pastas

```
api/                 Funções serverless (análise, desenhos, pictogramas, vídeos, transferência)
  _lib/              Lógica compartilhada e testada das funções
docs/                Especificação, créditos e material do artigo
public/              Ícones e favicon
scripts/             Scripts de apoio (figuras, ícones do PWA, gravação das falas)
src/
  assets/            Figuras (SVG), falas gravadas (MP3) e fontes do PDF
  atividades/        Motor comum e uma pasta por atividade
  audio/             Catálogo das falas
  components/        Componentes de interface
  contexts/          Sessão e modo convidado
  hooks/             Hooks de dados (alunos, sessões)
  lib/               Firebase, voz, sugestão de nível, progresso, PDF e outras funções
  pages/             Uma tela por rota
  prancha/           Prancha de comunicação
firestore.rules      Regras de segurança do Firestore
vercel.json          Região das funções e redirecionamentos
```

No código, os nomes do domínio estão em português (aluno, sessao, atividade) e os termos
técnicos em inglês.
