# RF16 - Tutorial guiado de primeiro acesso

| Campo | Valor |
| --- | --- |
| ID | RF16 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Conteudo educacional |
| Status | Nao implementado |
| Requisitos relacionados | RF09, RF11, RF20, RNF01, RNF09 |

## 1. Enunciado

> A plataforma deve fornecer um tutorial guiado de primeiro acesso apresentando o
> fluxo basico de utilizacao.

## 2. O que e

Uma sequencia curta de passos sobrepostos a interface real, que destaca um
elemento por vez e explica para que serve, na ordem do fluxo de trabalho: editor,
abas de arquivo, botao executar, console, formas de onda.

A biblioteca prevista em `docs/PROJECT_CONTEXT.md` e **driver.js** ou Intro.js.
O que distingue o tutorial guiado da documentacao (RF11) e o contexto: aqui o
texto aparece **em cima** do elemento de que fala, na primeira vez em que o
usuario chega.

## 3. Para que serve

O workspace mostra tres paineis, abas e uma barra superior de uma vez so. Para
quem ja usou uma IDE isso e obvio; para quem nunca escreveu HDL, e uma tela cheia
de coisas sem rotulo evidente. Os primeiros trinta segundos decidem se a pessoa
tenta ou fecha a aba.

O tutorial resolve o problema especifico de "nao sei por onde comecar", que a
documentacao resolve pior - ler um guia exige sair da tela e ter paciencia; o
tour acontece onde a pessoa ja esta.

E o instrumento mais direto de RNF01 (interface orientada a iniciantes).

## 4. Impacto

**Para o usuario.** Reduz o abandono no primeiro acesso e cria o modelo mental do
fluxo em menos de um minuto.

**Na interface.** Exige ancoras estaveis. Um tour costuma ser preso a seletores
CSS; se a marcacao mudar, o tour aponta para o vazio - e ninguem percebe, porque
so o primeiro acesso o executa. A protecao e usar atributos dedicados
(`data-tour="run-button"`) e falhar de forma visivel quando a ancora sumir.

**Na experiencia recorrente.** Um tour que reaparece e irritante. Precisa rodar
uma vez, ser dispensavel a qualquer momento e ter um caminho explicito para
reabrir - a preferencia mora em `localStorage`, como o tema.

**Na acessibilidade.** Sobreposicoes com foco preso sao um risco classico: foco
perdido, leitor de tela lendo o conteudo de fundo, impossibilidade de sair por
teclado. RNF09 nao cobre isso diretamente, mas os mesmos principios se aplicam.

## 5. Estado atual no repositorio

- Nao ha `driver.js` nem Intro.js em `apps/web/package.json`.
- Nao ha nenhuma marcacao de ancora nos componentes do workspace.
- `ThemeProvider` ja estabelece o padrao de preferencia em `localStorage` com
  `try/catch` (chave `tplab-theme`) - o tutorial deve seguir o mesmo padrao.
- `apps/web/src/lib/samples.ts` carrega o somador de exemplo, o que garante
  conteudo na tela durante o tour.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Tour de 5 a 7 passos cobrindo o fluxo basico.
- Deteccao de primeiro acesso e controle de reexibicao.
- Acao para reabrir o tour a qualquer momento.
- Ancoras estaveis e comportamento acessivel.

**Fora**

- Tours por funcionalidade avancada (editor visual, compartilhamento).
- Tutorial interativo que exige o usuario executar acoes para avancar.
- Trilha de aprendizagem ou sequencia de licoes (Won't Have).
- Video ou animacao.

## 7. Criterios de aceite da feature

- [ ] No primeiro acesso o tour inicia sozinho, apos a interface carregar.
- [ ] O tour cobre editor, abas, executar, console e formas de onda.
- [ ] E possivel pular a qualquer momento, inclusive por `Esc`.
- [ ] Concluido ou pulado, nao reaparece em acessos seguintes.
- [ ] Existe uma acao visivel para reabrir o tour.
- [ ] O tour e navegavel por teclado, com foco tratado corretamente.
- [ ] Uma ancora ausente nao quebra a aplicacao.
- [ ] Os textos estao alinhados com o guia de RF11.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-tour-e-ancoras.md) | Tour guiado, roteiro e ancoras | `feat/rf16-tour-e-ancoras` | M |
| [issue-02](issue-02-primeiro-acesso-e-reabertura.md) | Controle de primeiro acesso e reabertura | `feat/rf16-primeiro-acesso-e-reabertura` | P |

## 9. Dependencias

- Depende de a interface de RF09 estar estavel - refazer o layout depois quebra
  as ancoras.
- Reaproveita o conteudo de RF11-I02 e o exemplo de RF20.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
