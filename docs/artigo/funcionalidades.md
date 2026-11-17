# Funcionalidades do EducAEE

Situação em 16/11/2026. Site: https://www.educaee.com.br (gratuito, sem anúncios próprios, em português
do Brasil).

## Para a professora (com login Google)

- **Painel de alunos:** cadastro com nome ou apelido e turma opcional; filtro por turma; menu de
  cada aluno (editar, transferir, excluir).
- **Perfil de acessibilidade por aluno,** com prévia ao vivo: tamanho dos elementos (normal 64 px,
  grande 88 px, muito grande 120 px de área de toque), alto contraste, sons de acerto e erro,
  animações reduzidas, leitura em voz alta, velocidade da voz e tema de interesse das figuras
  (animais, dinossauros, veículos, frutas, espaço).
- **Escolha de atividade** agrupada pelas 7 habilidades, com o nível atual de cada uma; é possível
  jogar uma rodada avulsa em outro nível.
- **Trilha do dia:** 4 atividades escolhidas a partir do histórico dos últimos 21 dias
  (aquecimento com a de melhor desempenho, dois focos — a de pior desempenho e a menos praticada —
  e uma final com a mais jogada); sem histórico, varia por dia.
- **Motor comum das atividades:** rodadas curtas, em geral de 8 jogadas, instrução escrita e falada, botões "Ouvir
  de novo", "Pausar" (para o cronômetro e a voz) e "Sair" (com confirmação); tela de resultado
  com acertos, erros e tempo.
- **Sugestão de nível:** ao fim da rodada, sugere subir (as 2 últimas rodadas no nível foram
  fáceis: ≥ 90% de acerto) ou descer (última rodada < 50%); na memória, conta erros por par. Nunca
  muda sozinho: a professora aceita ou mantém.
- **Progresso:** filtro de 7 dias, 30 dias ou tudo; total de rodadas, última atividade, nível,
  rodadas e acerto médio por atividade, gráfico da taxa de acerto e histórico em tabela.
- **Análise com IA:** texto com visão geral, pontos fortes, pontos de atenção, evolução no período
  e sugestões para os próximos atendimentos, gerado a partir de indicadores calculados no servidor
  (sem o nome do aluno).
- **Relatório em PDF** (A4): cabeçalho, resumo, análise, gráficos por atividade e histórico;
  funciona offline.
- **Desenhos para colorir com IA:** a partir de um tema, 2 desenhos de contorno por pedido, para
  imprimir (A4) ou baixar em PNG.
- **Vídeos:** busca no YouTube restrita a conteúdo infantil, com filtro adicional por IA; player
  sem sugestões de outros vídeos no fim e com controles grandes; opção de esconder um vídeo.
- **Prancha de comunicação (CAA):** vocabulário padrão em 4 categorias (Eu quero, Eu sinto,
  Respostas, Pessoas e lugares), barra de frase falada, 2/4/6/9 cartões por tela; personalização
  por aluno (ligar, desligar e ordenar cartões) e cartões próprios com pictograma e fala gerados
  por IA; PDF para imprimir e recortar.
- **Transferência de aluno por código:** gera um código de 6 caracteres (7 dias, uso único) para
  outra professora receber o aluno com todo o histórico e os cartões da prancha; pode remover o
  aluno da conta de origem.
- **Conta:** sair (apaga a cópia offline do navegador) e excluir a conta com todos os dados.

## Para todos

- **Modo convidado:** todas as atividades e a prancha padrão sem login e sem salvar nada
  (sugestões de nível valem até recarregar a página).
- **PWA instalável e offline:** depois da primeira visita, atividades, figuras, falas e PDF
  funcionam sem internet; rodadas feitas offline são enviadas quando a conexão volta.
- **Voz gravada** (Gemini TTS, voz calma em pt-BR) para as falas fixas, com a voz do navegador como
  reserva.
- **Tema claro, escuro ou automático** para a interface (nas atividades, o alto contraste do aluno
  sempre prevalece); impressão e PDF sempre claros.
- Páginas Sobre e Privacidade.

## As 16 atividades

Todas têm 4 níveis. A tabela descreve o que muda de um nível para o outro.

| Atividade            | Habilidade         | Nível 1                                     | Nível 2                    | Nível 3                             | Nível 4                                                |
| -------------------- | ------------------ | ------------------------------------------- | -------------------------- | ----------------------------------- | ------------------------------------------------------ |
| Jogo da memória      | Memória            | 2 pares, com "espiar" no início             | 4 pares, com "espiar"      | 6 pares                             | 8 pares                                                |
| Pares que combinam   | Memória            | 2 pares de figuras associadas               | 4 pares                    | 6 pares                             | 6 pares figura–sombra                                  |
| O que está faltando? | Memória            | olhar 3 figuras (3,5 s); 2 opções           | 3 figuras; 3 opções        | 4 figuras; 4 opções                 | 5 figuras; 4 opções                                    |
| Encontre o igual     | Atenção            | 2 opções                                    | 4 opções                   | 6 opções                            | 6 opções de cor parecida com o modelo                  |
| Pegue só o...        | Atenção            | grade de 4 figuras, 2 certas                | grade de 6, 2 certas       | grade de 8, 3 certas                | uma figura por vez: tocar só na pedida ("vai/não vai") |
| Qual é a sombra?     | Atenção            | 2 sombras                                   | 3 sombras                  | 4 sombras                           | 6 sombras                                              |
| Toque no alvo        | Coordenação motora | alvo grande (~60% da tela) que cresce       | alvo médio (~40%)          | alvo pequeno (~25%)                 | alvo pequeno andando e quicando nas bordas             |
| Caminhos             | Coordenação motora | linha reta (horizontal ou inclinada), larga | curvas (onda, ponte, vale) | zigue-zague, serra ou degraus       | letras de um traço, caminho mais estreito              |
| Toque e segure       | Coordenação motora | segurar 1 s, alvo no centro                 | 1,5 s                      | 2 s                                 | 2 s, alvo menor que muda de lugar                      |
| Letras e sílabas     | Alfabetização      | vogais (ouvir e tocar)                      | consoantes                 | sílabas simples (consoante + vogal) | palavras simples com figura                            |
| Sons das palavras    | Alfabetização      | sílaba inicial, 2 opções                    | sílaba inicial, 3 opções   | rima, 2 opções                      | rima, 3 opções                                         |
| Monte a palavra      | Alfabetização      | palavras de 2 sílabas                       | 2 sílabas + 1 sobrando     | palavras de 3 sílabas               | 3 sílabas + sobrando                                   |
| Complete a sequência | Lógica             | AB AB A_ com formas (cada cor, uma forma)   | AB com figuras             | ABC ABC AB_                         | AAB, ABB, ABA ou AABB                                  |
| Rotina do dia        | Lógica             | ordenar 3 cenas, a 1ª já no lugar           | 3 cenas                    | 4 cenas, a 1ª já no lugar           | 4 cenas                                                |
| Contar               | Matemática         | contar até 3                                | até 5                      | até 10 (4 opções)                   | qual grupo tem mais                                    |
| Emoções              | Emoções            | reconhecer o rosto, 2 opções                | 3 opções                   | 4 opções                            | situação narrada: como a pessoa se sente?              |

Habilidades: Memória (3), Atenção (3), Coordenação motora (3), Alfabetização (3), Lógica (2),
Matemática (1) e Emoções (1).

## Números do projeto

| Item                          | Valor                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| Atividades                    | 16 (4 níveis cada = 64 configurações)                                 |
| Testes automatizados (Vitest) | 228 testes em 30 arquivos, todos passando                             |
| Falas no catálogo de voz      | 592                                                                   |
| Falas gravadas em MP3         | 592                                                                   |
| Figuras (SVG)                 | 153                                                                   |
| Linhas de código              | ≈ 19.400 (TypeScript/TSX, CSS e scripts), das quais ≈ 2.400 de testes |
| Arquivos de código            | 227                                                                   |
| Funções serverless            | 5                                                                     |
| Pacote inicial do site        | ~103 KB (gzip)                                                        |
