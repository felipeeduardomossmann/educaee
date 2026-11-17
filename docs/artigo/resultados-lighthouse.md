# Resultados do Lighthouse

- **Data:** 02/11/2026 (por volta de 20h30, horário de Brasília)
- **Ferramenta:** Lighthouse 13.6.0 (API de Node, _user flows_), Chrome 156 em modo headless
- **Alvo:** site em produção, https://www.educaee.com.br (Vercel)
- **Perfis:** "Mobile" = padrão do Lighthouse (Moto G Power emulado, 4G lento simulado, CPU 4×
  mais lenta); "Desktop" = configuração `desktop` oficial do Lighthouse.

## Notas (0–100)

| Página                               | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |
| ------------------------------------ | ------- | :---------: | :------------: | :-----------: | :-: |
| Página inicial (`/`)                 | Mobile  |     100     |      100       |      100      | 92  |
| Página inicial (`/`)                 | Desktop |     100     |      100       |      100      | 92  |
| Atividade (Jogo da memória, nível 1) | Mobile  |    85 \*    |      100       |      100      | 83  |
| Atividade (Jogo da memória, nível 1) | Desktop |    75 \*    |      100       |      100      | 83  |

Referência: a tela de escolha do modo convidado (`/convidado`) teve 100 / 100 / 100 / 92 nos
dois perfis.

### Métricas da página inicial

| Métrica                  | Mobile | Desktop |
| ------------------------ | ------ | ------- |
| First Contentful Paint   | 0,8 s  | 0,2 s   |
| Largest Contentful Paint | 1,5 s  | 0,4 s   |
| Total Blocking Time      | 10 ms  | 0 ms    |
| Cumulative Layout Shift  | 0,001  | 0       |
| Speed Index              | 1,2 s  | 0,4 s   |

## Como a atividade foi medida

As atividades não têm endereço próprio que abra direto: o aluno (ou o convidado) e o nível
chegam pelo estado da navegação, e recarregar a página volta para a tela de escolha. Por isso a
atividade foi medida com um **fluxo de usuário**: navegação até `/convidado`, depois um
_timespan_ do toque em "Jogo da memória" → "Começar" até o tabuleiro aparecer, e por fim um
_snapshot_ da tela da atividade.

- **Performance (\*)** vem do _timespan_, que avalia só o bloqueio da linha principal e a
  estabilidade visual durante a interação (não há LCP nem FCP numa troca de tela dentro da
  aplicação). O que reduziu a nota foi o _Total Blocking Time_ ao carregar o código da atividade
  e as figuras (360 ms no mobile, 320 ms no desktop); o CLS ficou em 0,03 e 0,02. Ela não é
  diretamente comparável à nota de Performance de uma navegação completa.
- **Acessibilidade e SEO** vêm do _snapshot_ da tela em jogo; **Boas práticas** teve 100 nos dois
  modos.

## Observação sobre o SEO

A única auditoria de SEO reprovada em todas as páginas foi **`robots-txt`**: o site não tem um
arquivo `robots.txt` e o endereço `/robots.txt` cai no _fallback_ da aplicação (devolve o HTML da
página), que o Lighthouse lê como um `robots.txt` inválido. Acrescentar um `public/robots.txt`
simples deve levar o SEO a 100; o site foi medido como estava, sem essa mudança. Na tela da
atividade, a falha é a mesma: o _snapshot_ avalia menos auditorias de SEO do que uma navegação,
então o `robots-txt` pesa mais na média (83).
