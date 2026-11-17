# Tecnologias e arquitetura do EducAEE

Versões instaladas em 02/11/2026 (`package-lock.json`).

## Tecnologias

| Camada                    | Tecnologia                                                                                  | Versão                    |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------- |
| Interface                 | React                                                                                       | 19.3                      |
| Linguagem                 | TypeScript (modo _strict_)                                                                  | 6.0                       |
| Build e servidor de dev   | Vite                                                                                        | 8.3                       |
| Estilos                   | Tailwind CSS                                                                                | 4.3                       |
| Rotas                     | React Router (modo biblioteca)                                                              | 8.5                       |
| Gráficos                  | Recharts                                                                                    | 3.10                      |
| PDF (relatório e prancha) | jsPDF + jspdf-autotable                                                                     | 4.2 / 5.0                 |
| PWA (offline)             | vite-plugin-pwa (Workbox)                                                                   | 2.0                       |
| Fonte                     | Nunito (`@fontsource/nunito`)                                                               | 5.3                       |
| Figuras                   | Fluent Emoji Flat (Microsoft, licença MIT)                                                  | 153 SVGs usados           |
| Login                     | Firebase Authentication (Google)                                                            | SDK `firebase` 12.19      |
| Banco de dados            | Cloud Firestore (região São Paulo)                                                          | SDK `firebase` 12.19      |
| Servidor                  | Funções serverless da Vercel (Node.js 24)                                                   | região `gru1` (São Paulo) |
| Servidor → banco          | Firebase Admin SDK                                                                          | 14.5                      |
| Servidor → login          | `jose` (verificação do token de ID, RS256)                                                  | 6.2                       |
| IA de imagem              | Google Gemini (`gemini-nano-banana-2.1`)                                                    | API Interactions          |
| IA de texto               | Google Gemini (`gemini-3.6-flash`; filtro de vídeos com `gemini-3.5-flash-lite`)            | API Interactions          |
| Voz                       | Gemini TTS (`gemini-3.8-flash-tts`), MP3 com `@breezystack/lamejs`; reserva: Web Speech API | —                         |
| Sons de acerto/erro       | Web Audio API (gerados, sem arquivos)                                                       | —                         |
| Vídeos                    | YouTube Data API v3 + IFrame Player API                                                     | —                         |
| Testes                    | Vitest                                                                                      | 5.0                       |
| Qualidade                 | ESLint 10 + typescript-eslint, Prettier 3                                                   | —                         |
| Hospedagem                | Vercel (deploy automático a cada push)                                                      | —                         |

## Arquitetura (resumo)

O EducAEE é uma **aplicação de página única (SPA)** instalável como **PWA**. O site estático é
servido pela Vercel e, depois da primeira visita, o _service worker_ guarda todo o código, as
figuras, as fontes e as falas gravadas: as atividades funcionam sem internet. O navegador fala
direto com o Firebase para o login (Google) e para os dados (alunos, rodadas, análises e
cartões da prancha); o Firestore mantém uma cópia local, então rodadas feitas offline são
enviadas quando a conexão volta.

Tudo o que usa chaves secretas ou serviços pagos fica em **funções serverless** (`/api/desenho`,
`/api/analise`, `/api/pictograma`, `/api/videos`, `/api/transferencia`), executadas em São Paulo.
Fluxo de uma requisição de IA (ver `fig-arquitetura.png`):

1. O navegador envia o pedido com o **token de ID** do Firebase.
2. A função confere a assinatura do token com as chaves públicas do Google (`jose`).
3. Numa **transação** do Firestore, reserva o uso nos limites diário (por usuário) e mensal (do
   site todo ou por usuário, conforme a função).
4. Chama o Gemini (ou o YouTube) com um prompt fixo; recusas e falhas devolvem a reserva.
5. Devolve o resultado ao navegador. Nada da resposta fica guardado no servidor.

A divisão do código preserva o carregamento rápido: o pacote inicial tem ~103 KB (gzip); o
Firestore só carrega depois do login (o modo convidado nunca o carrega), o Recharts só na tela de
progresso e o jsPDF só ao baixar um PDF.

## Segurança

- **Regras do Firestore** (`firestore.rules`): cada professora só lê e escreve dentro de
  `users/{seu uid}`; as regras validam o formato de cada documento (campos permitidos, tamanhos,
  níveis de 1 a 4, datas de rodada que não podem estar no futuro, análise com `geradaEm` igual à
  hora do servidor). Coleções de controle (contadores de uso, cache de vídeos, códigos de
  transferência) são negadas ao navegador e só o servidor (SDK Admin) as acessa.
- **Chaves** (Gemini, YouTube, conta de serviço) existem só nas variáveis de ambiente das funções;
  nunca chegam ao navegador nem ao repositório.
- **Limites de uso** contra abuso e custo: desenhos/pictogramas 10 por dia por usuário e 150 por
  mês no site; análises 20 por dia e 1.000 por mês no site; vídeos 20 buscas por dia e 600 por mês
  por usuário; tentativas de transferência 10 por hora, 30 por dia e 300 por mês por usuário. O identificador do usuário nos contadores é um hash (SHA-256).
- **Filtros de conteúdo** do Gemini no nível mais restritivo; vídeos só com `safeSearch=strict`,
  marcados como "feitos para crianças", incorporáveis e aprovados por um filtro de IA.
- **Códigos de transferência** de 6 caracteres sem símbolos ambíguos, gerados com
  `crypto.randomInt`, válidos por 7 dias e de uso único.

## Privacidade

- **Dados mínimos do aluno:** nome ou apelido (a tela recomenda só o primeiro nome), turma
  opcional, perfil de acessibilidade, níveis e rodadas (acertos, erros, duração e data). Não há
  diagnóstico, foto, data de nascimento ou laudo.
- **Análise com IA sem identificação:** o navegador monta só números por atividade; o servidor
  reconstrói o objeto com os campos esperados e calcula indicadores (tendência, consistência,
  sinais de nível). A IA recebe **apenas esses indicadores**, escreve "o aluno" e o nome é
  colocado depois, só na tela e no PDF.
- **Nada guardado nas funções:** desenhos e resultados não são salvos no servidor (os desenhos
  ficam só na memória da visita); as chamadas de desenho, pictograma e análise ao Gemini usam
  `store: false`.
- **Dados no Brasil:** Firestore e funções em São Paulo; o Gemini e o YouTube podem processar fora
  do Brasil (informado na página de Privacidade).
- **Modo convidado:** nada é salvo; a única informação guardada no navegador é a escolha do tema
  claro/escuro.
- **Computadores compartilhados:** o login sempre pergunta qual conta usar e, ao sair, a cópia
  offline do Firestore é apagada do navegador.
- **Exclusão:** a professora pode excluir um aluno (com todas as rodadas) ou a conta inteira
  (alunos, rodadas, cartões e o registro no Auth).
- **Sem anúncios e sem rastreamento:** nenhum script de análise de tráfego ou publicidade.
