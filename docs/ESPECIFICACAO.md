# EducAEE — Especificação do projeto

> **Slogan:** Trilhando a sua evolução de maneira personalizada.
> **Domínio:** https://educaee.com.br

Este documento é a especificação inicial do site, com as 5 primeiras atividades. O desenvolvimento foi feito nas etapas da seção 12. As funcionalidades acrescentadas depois estão descritas em [`artigo/funcionalidades.md`](artigo/funcionalidades.md).

---

## 1. Visão geral

O EducAEE é uma plataforma web **gratuita**, **sem anúncios** e **em português do Brasil** com atividades educativas adaptáveis para o **Atendimento Educacional Especializado (AEE)**: o atendimento a alunos com deficiência, Transtorno do Espectro Autista (TEA) e outras necessidades específicas, nas salas de recursos das escolas públicas.

**Quem usa:**

- **Professoras(es) do AEE e monitoras(es):** fazem login, cadastram alunos, escolhem atividades e acompanham o progresso.
- **Alunos (crianças):** jogam as atividades, sempre com a mediação de um adulto.

**Problemas que o site resolve** (levantados em pesquisa com 21 profissionais do AEE):

- Jogos encontrados na internet não se adaptam ao nível cognitivo/motor do aluno.
- Excesso de propaganda que o aluno clica sem querer.
- Necessidade de criar conta/login em cada site e perder tempo do atendimento.
- Falta de recursos que prendam a atenção do aluno.
- Excesso de estímulos (som/animação) que incomoda alunos com TEA.
- Botões pequenos e tempo limite que impedem alunos com dificuldade motora.
- Falta de registro do que o aluno fez para o plano de AEE e para as famílias.
- Jogos que não salvam onde o aluno parou.
- Jogos que não funcionam bem com toque no Chromebook.

---

## 2. Stack técnica

| Item           | Escolha                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | React 18+ com **Vite** e **TypeScript** (modo `strict`)                                                                                                           |
| Estilo         | **Tailwind CSS**                                                                                                                                                  |
| Rotas          | **React Router**                                                                                                                                                  |
| Autenticação   | **Firebase Authentication**: apenas provedor **Google**                                                                                                           |
| Banco de dados | **Cloud Firestore** (região `southamerica-east1`)                                                                                                                 |
| Gráficos       | **Recharts**                                                                                                                                                      |
| PWA / offline  | **vite-plugin-pwa**                                                                                                                                               |
| Voz            | **Web Speech API** (`speechSynthesis`, voz `pt-BR`)                                                                                                               |
| Fonte          | **Nunito** (arredondada) via `@fontsource/nunito`, com hospedagem própria e funcionamento offline                                                                 |
| Figuras        | **Fluent Emoji Flat (MIT)** em SVG, empacotado no projeto, para ficar igual em todos os sistemas. Créditos na página Sobre. Não use os emojis nativos do sistema. |
| Sons           | Tons gerados no navegador com a **Web Audio API** (sem arquivos de áudio).                                                                                        |
| Testes         | **Vitest**, só para a lógica de sugestão de nível e as funções principais.                                                                                        |
| Hospedagem     | **Vercel** (deploy automático a cada push na `main`)                                                                                                              |
| Lint/format    | ESLint + Prettier                                                                                                                                                 |

O navegador conversa direto com o Firebase. O que exige chaves secretas (IA, vídeos e transferência de aluno) fica em funções serverless da Vercel, acrescentadas depois desta especificação.

### Configuração do Firebase

Use variáveis de ambiente (`.env.local`, que **não** vai para o git, e um `.env.example` versionado). Os mesmos valores serão cadastrados na Vercel.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Os valores reais ficam só no `.env.local` (fora do git) e nas variáveis de ambiente da Vercel.

Já configurado no console: provedor Google ativado; domínios autorizados `localhost`, `educaee.com.br` e `www.educaee.com.br`; Firestore criado em modo produção.

---

## 3. Modos de uso

### 3.1 Com conta (login Google)

- Botão "Entrar com Google" (`signInWithPopup`, com fallback para `signInWithRedirect` se o popup for bloqueado).
- Aceita qualquer conta Google: Gmail ou Google Workspace da escola.
- Todos os dados ficam salvos no Firestore, separados por usuário.

### 3.2 Convidado (sem conta)

- Botão "Usar sem conta".
- Acesso a **todas as atividades** e aos **ajustes de acessibilidade**, valendo só para a sessão atual.
- **Nada é salvo**, nem no Firestore nem no `localStorage`. O estado fica só em memória e se perde ao fechar ou recarregar.
- Faixa fixa e discreta no topo: "Você está no modo convidado: nada será salvo. [Entrar com Google]".
- Sem acesso a: painel de alunos, progresso, conta.

---

## 4. Telas e rotas

| Rota                                | Tela                                                        | Acesso  |
| ----------------------------------- | ----------------------------------------------------------- | ------- |
| `/`                                 | Página inicial                                              | Público |
| `/painel`                           | Meus alunos                                                 | Login   |
| `/aluno/novo` e `/aluno/:id/editar` | Cadastro/edição do aluno                                    | Login   |
| `/aluno/:id/atividades`             | Escolha de atividade (com perfil do aluno aplicado)         | Login   |
| `/aluno/:id/progresso`              | Progresso do aluno                                          | Login   |
| `/convidado`                        | Escolha de atividade em modo convidado                      | Público |
| `/atividade/:atividadeId`           | A atividade em si (recebe aluno ou convidado pelo contexto) | Ambos   |
| `/conta`                            | Minha conta                                                 | Login   |
| `/sobre`                            | Sobre o EducAEE                                             | Público |
| `/privacidade`                      | Política de privacidade                                     | Público |
| `*`                                 | Página 404 amigável                                         | Público |

Rotas de login redirecionam para `/` se não houver sessão. Se o usuário já está logado e abre `/`, mostre um atalho "Ir para meus alunos".

### 4.1 Página inicial (`/`)

- Logo "EducAEE" (sempre escrito com "AEE" em maiúsculas) e o slogan.
- 2 a 3 frases sobre o que é o site.
- Dois botões grandes: **Entrar com Google** e **Usar sem conta**.
- Bloco curto com 3 a 4 destaques: "Sem propaganda", "Adapta-se a cada aluno", "Registra a evolução", "Funciona no Chromebook com toque".
- Rodapé: Sobre · Privacidade.

### 4.2 Painel – Meus alunos (`/painel`)

- Saudação com o primeiro nome do usuário.
- Grade de cards de alunos: **nome/apelido** em destaque e **turma** abaixo. Ordenação alfabética.
- Filtro/seleção por turma (só aparece se houver mais de uma turma).
- Botão **+ Novo aluno**.
- Cada card tem dois botões grandes: **Atividades** e **Progresso**, mais um menu discreto (⋯) com **Editar** e **Excluir**.
- Estado vazio: ilustração + "Cadastre seu primeiro aluno para começar".

### 4.3 Cadastro/edição do aluno

- **Nome ou apelido** (obrigatório, até 40 caracteres). Texto de ajuda: "Para proteger a privacidade, use só o primeiro nome ou um apelido."
- **Turma** (opcional, até 30 caracteres, ex.: "3º ano B").
- **Ajustes de acessibilidade e preferências** (seção 5), com valores padrão já preenchidos e uma prévia visual simples.
- Salvar / Cancelar.
- Na edição: botão **Excluir aluno** com confirmação ("Isso apaga o aluno e todo o histórico. Não pode ser desfeito.").

### 4.4 Escolha de atividade

- Topo: "Jogando: **[nome do aluno]**" (ou "Convidado") e botão **Ajustes** (abre os ajustes; com login, salva no perfil; como convidado, vale só para a sessão).
- Atividades agrupadas por habilidade, em cards grandes com ícone, nome e nível atual do aluno naquela atividade.
- Ao tocar numa atividade: escolher nível (o nível atual do aluno vem pré-selecionado) e **Começar**.

### 4.5 Atividade

- Tela cheia, foco total no jogo.
- No máximo 3 controles fixos, grandes: **Sair**, **Ouvir de novo** (repete a instrução) e **Pausar**.
- Instrução falada no início de cada jogada, se a leitura em voz alta estiver ligada, e também escrita em texto grande.
- Detalhes por atividade na seção 6.

### 4.6 Resultado (ao fim da rodada)

- Mensagem positiva sempre (mesmo com muitos erros).
- Acertos, erros e duração da rodada.
- **Sugestão de nível** (seção 6.8), quando houver: "Parece fácil para [nome]. Subir para o nível 3?" [Subir] [Manter]. **Nunca muda sozinho.**
- Botões: **Jogar de novo**, **Escolher outra atividade**.
- Com login, a rodada é salva automaticamente (seção 7).

### 4.7 Progresso do aluno (`/aluno/:id/progresso`)

- Cabeçalho: nome, turma, total de rodadas, última atividade.
- Por atividade: nível atual, total de rodadas, taxa média de acerto e um **gráfico de linha simples** com a taxa de acerto por rodada ao longo do tempo (Recharts).
- Tabela de histórico (data, atividade, nível, acertos, erros, duração), com filtro por período (últimos 7 dias / 30 dias / tudo).
- Botão **Imprimir / salvar PDF** (`window.print()` com CSS de impressão próprio: fundo branco, sem botões, cabeçalho "EducAEE – Relatório de progresso – [nome] – [data]").

### 4.8 Minha conta (`/conta`)

- Foto, nome e e-mail da conta Google.
- **Sair**.
- **Excluir minha conta e todos os dados**: confirmação forte (digitar "EXCLUIR"), apaga todos os alunos e sessões do usuário no Firestore e depois a conta no Firebase Auth (tratar `auth/requires-recent-login` pedindo novo login).

### 4.9 Sobre e Privacidade

- **Sobre:** o que é o EducAEE, para quem é, que nasceu de uma pesquisa com profissionais do AEE da rede municipal de Dois Irmãos/RS, créditos das figuras e da fonte. **Não mencionar TCC nem universidade.**
- **Privacidade:** linguagem simples.
  - O que é salvo: e-mail e nome da conta Google, nome/apelido e turma dos alunos, preferências e resultados das atividades.
  - Onde fica: Google Firebase, no Brasil.
  - Quem vê: só o próprio usuário.
  - Sem propaganda, sem rastreamento, sem venda de dados.
  - Como excluir: aluno a aluno ou a conta inteira.
  - No modo convidado, nada é salvo.
  - Recomendação de usar apelido.
  - Contato para dúvidas e pedidos sobre os dados: felipeeduardomossmann@gmail.com (só nesta página).

---

## 5. Perfil de acessibilidade do aluno

Salvo em cada aluno (com login) ou mantido em memória (convidado). Aplicado automaticamente em **todas** as atividades daquele aluno.

| Ajuste                | Opções                                         | Padrão  | Efeito                                                                                                                             |
| --------------------- | ---------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tamanho dos elementos | Normal / Grande / Muito grande                 | Grande  | Escala botões, cartas, alvos e textos nas atividades. Área mínima de toque: 64 px (normal), 88 px (grande), 120 px (muito grande). |
| Contraste             | Normal / Alto                                  | Normal  | Alto contraste: fundo escuro liso, contornos grossos, cores de contraste ≥ 7:1.                                                    |
| Sons                  | Ligado / Desligado                             | Ligado  | Efeitos sonoros de acerto/erro (curtos e suaves). Não afeta a voz.                                                                 |
| Animações             | Normais / Reduzidas                            | Normais | Reduzidas: sem movimento decorativo, transições instantâneas, alvos parados. Respeitar também `prefers-reduced-motion` do sistema. |
| Leitura em voz alta   | Ligada / Desligada                             | Ligada  | Lê as instruções com voz pt-BR.                                                                                                    |
| Velocidade da voz     | Lenta / Normal                                 | Lenta   | `rate` 0.8 ou 1.0.                                                                                                                 |
| Tema de interesse     | Animais, Dinossauros, Veículos, Frutas, Espaço | Animais | Define as figuras usadas nas atividades (seção 6.6).                                                                               |

**Regra global:** nenhuma atividade penaliza a demora.

---

## 6. Atividades

### 6.1 Regras comuns

- Rodadas curtas, em geral de **8 jogadas** (configurável por atividade em código).
- **Erro nunca pune:** retorno gentil ("Quase! Tente de novo"), som suave (se ligado) e o aluno tenta de novo na mesma jogada. Conta como erro para as estatísticas.
- **Acerto:** retorno positivo curto e visual (estrela/brilho discreto, sem explosões piscando), som suave (se ligado).
- Funciona igual com **mouse e toque**: usar Pointer Events, sem hover obrigatório, sem arrastar obrigatório nos níveis iniciais.
- Instrução falada e escrita em cada jogada.
- Nada de texto pequeno, menus ou elementos que distraiam durante a atividade.
- Cada atividade deve ser um módulo isolado (ex.: `src/atividades/memoria/`) que recebe `{ nivel, perfil, tema }` e devolve `{ acertos, erros, duracaoSeg }` ao terminar, para facilitar adicionar novas atividades no futuro.

### 6.2 Jogo da memória (Memória)

- Cartas viradas para baixo; o aluno vira duas por vez; pares iguais ficam abertos.
- Erro: par diferente (as cartas desviram após ~1,5 s, ou com toque se animações reduzidas).
- Níveis: **1** = 2 pares · **2** = 4 pares · **3** = 6 pares · **4** = 8 pares.
- Uma rodada = completar o tabuleiro (não usa 8 jogadas).

### 6.3 Encontre o igual (Atenção)

- No topo, uma figura modelo; abaixo, opções. O aluno toca na igual.
- Níveis: **1** = 2 opções · **2** = 4 opções · **3** = 6 opções · **4** = 6 opções com figuras parecidas (mesmo tema, cores próximas).

### 6.4 Toque no alvo (Coordenação motora)

- Uma figura aparece na tela; o aluno toca nela; ela some e aparece outra.
- Níveis: **1** = alvo muito grande, parado, no centro · **2** = alvo grande em posições variadas · **3** = alvo médio em posições variadas · **4** = alvo médio movendo-se devagar (com animações reduzidas, fica parado).
- O tamanho mínimo do alvo nunca fica abaixo da área de toque definida no perfil.
- Toque fora do alvo conta como erro só a partir do nível 3.

### 6.5 Letras e sílabas (Alfabetização)

- Sempre com áudio: a voz fala a letra, sílaba ou palavra, e o aluno toca na opção correta (3 opções).
- Níveis:
  - **1** = vogais (A, E, I, O, U)
  - **2** = consoantes comuns (B, C, D, F, G, L, M, N, P, R, S, T, V)
  - **3** = sílabas simples consoante+vogal (BA, BE, BI, BO, BU, MA, PA, LA…)
  - **4** = palavras simples com figura: mostra a figura e o aluno toca na palavra (BOLA, GATO, PATO, SAPO, CASA, DADO, MALA, VACA, FOCA, LUA, SOL, PÉ). Escolher palavras que tenham figura no conjunto de emojis.
- Letras em **maiúsculas de imprensa**, fonte grande.
- Se a leitura em voz alta estiver desligada no perfil, esta atividade avisa que precisa de áudio e oferece ligar só para ela.

### 6.6 Complete a sequência (Lógica)

- Mostra uma sequência com um espaço vazio no final; o aluno escolhe o que vem depois (3 opções).
- Níveis: **1** = AB AB A_ (cores) · **2** = AB AB A_ (figuras do tema) · **3** = ABC ABC AB_ · **4** = AAB AAB AA_ e similares.

### 6.7 Temas de figuras

Cada tema tem no mínimo 12 figuras distintas (emojis SVG): **Animais** (cachorro, gato, peixe, pássaro, coelho, vaca, porco, leão, macaco, tartaruga, sapo, abelha…), **Dinossauros** (dinossauro, T-rex, ovo, vulcão, pegada, folha, osso… complete com figuras relacionadas), **Veículos** (carro, ônibus, caminhão, moto, bicicleta, avião, barco, trem, foguete, trator, ambulância, viatura…), **Frutas** (maçã, banana, uva, morango, laranja, melancia, abacaxi, pera, cereja, limão, kiwi, manga…), **Espaço** (foguete, lua, sol, estrela, planeta, astronauta, cometa, satélite, ET, telescópio, Terra, disco voador…).

### 6.8 Sugestão de nível (sempre confirmada pela professora)

Avaliada ao fim de cada rodada, só com login, por aluno e por atividade:

- **Sugerir subir:** taxa de acerto ≥ 90% (acertos / (acertos+erros)) nas **2 últimas rodadas** daquele nível, e não está no nível máximo.
- **Sugerir descer:** taxa de acerto < 50% na **última rodada**, e não está no nível 1.
- A taxa de acerto não se aplica do mesmo jeito ao jogo da memória (tem erros naturais). Use **erros ≤ número de pares** como "fácil" e **erros ≥ 3 × número de pares** como "difícil".
- Se a professora aceitar, atualizar o nível atual do aluno naquela atividade.
- No modo convidado, a sugestão aparece só na tela de resultado, sem salvar.

---

## 7. Modelo de dados (Firestore)

```
users/{uid}
  email: string
  nome: string
  criadoEm: timestamp

users/{uid}/alunos/{alunoId}
  nome: string            // nome ou apelido, 1–40 caracteres
  turma: string           // 0–30 caracteres
  perfil: {
    tamanho: "normal" | "grande" | "muito_grande"
    contraste: "normal" | "alto"
    sons: boolean
    animacoesReduzidas: boolean
    leituraVoz: boolean
    velocidadeVoz: "lenta" | "normal"
    tema: "animais" | "dinossauros" | "veiculos" | "frutas" | "espaco"
  }
  niveis: { [atividadeId: string]: number }   // nível atual por atividade (1–4)
  criadoEm: timestamp
  atualizadoEm: timestamp

users/{uid}/alunos/{alunoId}/sessoes/{sessaoId}
  atividadeId: "memoria" | "igual" | "alvo" | "letras" | "sequencia"
  nivel: number
  acertos: number
  erros: number
  duracaoSeg: number
  concluidaEm: timestamp
```

- Habilitar a persistência offline do Firestore (`persistentLocalCache`), para que uma rodada feita com a internet caindo seja enviada depois.
- Excluir um aluno = excluir todas as `sessoes` dele (em lote) e depois o documento do aluno.

### 7.1 Regras de segurança (`firestore.rules`)

- Cada usuário só lê e escreve em `users/{uid}/**` quando `request.auth.uid == uid`.
- Tudo o mais é negado.
- Validar tipos e tamanhos: `nome` string de 1 a 40 caracteres; `turma` string de até 30; `nivel` inteiro de 1 a 4; `acertos`, `erros` e `duracaoSeg` inteiros ≥ 0; `atividadeId` na lista permitida.
- Versionar o arquivo no repositório e explicar como publicar (pelo console ou `firebase deploy --only firestore:rules`).

---

## 8. Identidade visual

- **Público final são crianças:** visual **infantil, colorido, alegre e acolhedor, mas calmo**.
- Paleta de cores alegres e suaves (pastéis vivos), sem neon e sem fundos saturados. Fundo claro e limpo nas atividades.
- Formas arredondadas, cantos bem arredondados, sombras leves, fonte **Nunito**.
- Um **mascote simples** (opcional, se ficar bom), que aparece na página inicial e na tela de resultado. Nada que pisque ou se mexa o tempo todo.
- Telas da professora (painel, progresso, conta) seguem a mesma identidade, mas mais organizadas e com menos decoração.
- Logo: escrita "Educ**AEE**" com o "AEE" destacado em outra cor. Gerar também o favicon e os ícones do PWA (192 e 512 px) a partir dela.
- Tudo em **português do Brasil**, com linguagem simples e direta.

---

## 9. Requisitos não funcionais

1. **Acessibilidade:** seguir **WCAG 2.1 nível AA** nas telas da professora (contraste ≥ 4,5:1, foco visível, navegação por teclado, `aria-label` em botões só com ícone, `lang="pt-BR"`). Nas atividades: alvos de toque grandes, nunca depender só de cor para transmitir informação, sem penalizar a demora, sem conteúdo piscando mais de 3 vezes por segundo.
2. **Compatibilidade:** Chrome/ChromeOS (Chromebook com toque) e desktop Windows (Chrome e Edge). Layout responsivo de 360 px a telas grandes, priorizando paisagem em notebook/Chromebook.
3. **Desempenho:** leve para máquinas modestas. Meta de Lighthouse ≥ 90 em Performance, Accessibility e Best Practices. Code splitting por rota/atividade. Figuras em SVG otimizado.
4. **Offline/PWA:** instalável, e as atividades funcionam com internet instável. Login e sincronização exigem conexão.
5. **Privacidade:**
   - sem anúncios, sem Google Analytics, sem pixels de rastreamento;
   - coletar só o necessário;
   - modo convidado não salva nada;
   - exclusão de dados disponível ao usuário.
6. **Simplicidade:** a partir do painel, o aluno chega à atividade em no máximo **3 toques** (aluno → atividade → começar).
7. **Qualidade de código:** TypeScript strict, componentes pequenos, sem `any`, nomes em português para domínio (aluno, sessao, atividade) e inglês para técnico. README com instruções de instalação, execução, variáveis de ambiente e deploy.

---

## 10. Fora do escopo (versões futuras)

- Compartilhar alunos entre professora e monitora.
- Pranchas de comunicação alternativa com fotos.
- Modo dupla (dois alunos ao mesmo tempo).
- Novas atividades.
- Painel para gestão da escola/secretaria.

---

## 11. Ainda a configurar (fora do código)

- **Vercel:** importar o repositório, cadastrar as variáveis de ambiente e conectar o domínio `educaee.com.br` (+ `www`).
- **Registro.br:** apontar o DNS para a Vercel.
- **Firebase Auth:** adicionar o domínio `*.vercel.app` do projeto aos domínios autorizados.
- **Google Cloud → tela de consentimento OAuth:** nome "EducAEE", logo, link da página inicial e da política de privacidade.

---

## 12. Ordem de desenvolvimento

1. **Base do projeto:** Vite + React + TS + Tailwind + Router + ESLint/Prettier, estrutura de pastas, `.env.example`, `.gitignore`, README. Primeiro commit e push para `main`.
2. **Identidade e layout:** paleta, fonte, logo, componentes base (botão, card, modal, faixa de convidado), página inicial, Sobre, Privacidade, 404.
3. **Autenticação:** login Google, modo convidado, rotas protegidas, Minha conta (sair/excluir).
4. **Alunos:** painel, cadastro/edição/exclusão, perfil de acessibilidade, regras do Firestore.
5. **Motor de atividades:** contexto de aluno/convidado, aplicação do perfil, voz, sons, tela de escolha, tela de resultado, gravação de sessão.
6. **Atividades:** uma por vez, na ordem memória → igual → alvo → letras → sequência.
7. **Sugestão de nível.**
8. **Progresso:** estatísticas, gráfico, histórico, impressão/PDF.
9. **PWA e polimento:** ícones, offline, revisão de acessibilidade, Lighthouse, testes no Chromebook.
