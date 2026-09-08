# RNF01 - Interface simples, orientada a usuarios iniciantes

| Campo | Valor |
| --- | --- |
| ID | RNF01 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Experiencia integrada |
| Status | Parcial (a base existe; falta revisao sistematica) |
| Requisitos relacionados | RF09, RF11, RF16, RF20, RF05, RNF09 |

## 1. Enunciado

> A interface deve seguir principios de simplicidade e ser orientada a usuarios
> iniciantes.

## 2. O que e

E o requisito de qualidade que atravessa todas as telas. Diferente dos
funcionais, nao se implementa uma vez: e um criterio aplicado a cada decisao de
interface, verificavel por revisao e por observacao de uso.

Traduzido em regras concretas para o TPLab:

- **vocabulario**: termos que o aluno de sistemas digitais reconhece, sem jargao
  de ferramenta profissional ("elaboracao", "netlist", "top-level entity");
- **caminho principal obvio**: escrever, executar, ler o resultado - visivel sem
  procurar;
- **nada obrigatorio antes de comecar**: sem login, sem criar projeto, sem
  configurar toolchain (RF01, RF14);
- **estados vazios que orientam**: um painel vazio diz o que fazer, nao apenas
  que esta vazio;
- **mensagens de erro acionaveis**: dizem o que aconteceu e o proximo passo
  (RF05-I03);
- **ausencia de opcao superflua**: cada controle na tela custa atencao.

## 3. Para que serve

O publico-alvo do trabalho e explicitamente quem esta em primeiro contato com
HDL. A analise comparativa do TCC identificou que as ferramentas profissionais
(Vivado, Quartus, ModelSim) falham para esse publico nao por falta de recurso, e
sim por excesso: sao construidas para engenheiros que ja sabem o que procuram.

Simplicidade nao e ausencia de recurso, e priorizacao: o caminho comum tem que
ser trivial, e o avancado pode exigir procurar.

## 4. Impacto

**No produto.** E o criterio que decide o que **nao** entra. Toda opcao
acrescentada precisa justificar o custo de atencao que impoe.

**Na verificacao.** Nao ha teste automatizado para "simples". A verificacao e por
revisao contra criterios explicitos e por observacao de pessoas reais usando -
o que faz RNF01 depender de RF17 (feedback) e RF19 (metricas) para deixar de ser
opiniao.

**Nas features relacionadas.** RF11 (documentacao), RF16 (tutorial), RF20
(exemplos) e RF05-I03 (mensagens amigaveis) existem em grande parte por causa
deste requisito.

**Tensao com outros requisitos.** Simplicidade conflita com completude: RF06-I03
(zoom, cursor, selecao de sinais) e RF09-I02 (atalhos) acrescentam controles. A
resolucao e a hierarquia - o caminho principal fica visivel, o resto fica
disponivel.

## 5. Estado atual no repositorio

Decisoes ja tomadas que servem ao requisito:

- a aplicacao abre direto no workspace, com codigo de exemplo carregado
  (`SAMPLE_SOURCES` em `apps/web/src/lib/samples.ts`) - nao ha tela intermediaria;
- o cabecalho tem poucos elementos: identidade, "Executar" e tema;
- shadcn/ui sobre Radix da comportamento acessivel de fabrica;
- os textos de interface ja estao em portugues (`ConsolePanel`, `WaveformPanel`,
  `theme-toggle`), com mensagens que orientam - o `WaveformPanel` chega a
  explicar `$dumpfile` e `$dumpvars`.

Lacunas:

- as mensagens do `iverilog` chegam cruas, em ingles (RF05-I03);
- nao ha documentacao (RF11) nem tutorial (RF16);
- nao ha vocabulario definido: cada texto novo escolhe seus proprios termos;
- nao ha registro de revisao de interface contra criterios.

## 6. Escopo

**Dentro**

- Glossario e guia de vocabulario da interface.
- Revisao sistematica dos textos existentes.
- Revisao dos estados vazios, de carregamento e de erro.
- Verificacao com usuarios reais do fluxo principal.

**Fora**

- Redesenho da interface (RF09 trata da estrutura).
- Internacionalizacao (Won't Have).
- Modo avancado ou personalizacao de interface.

## 7. Criterios de aceite da feature

- [ ] Existe um glossario de termos da interface, e os textos o seguem.
- [ ] Nenhum jargao aparece sem explicacao ou sem link para a documentacao.
- [ ] Todo estado vazio diz o que fazer, nao apenas que esta vazio.
- [ ] Toda mensagem de erro indica um proximo passo.
- [ ] O caminho principal e alcancavel sem instrucao previa.
- [ ] Ao menos tres pessoas do publico-alvo completam o fluxo sem ajuda.
- [ ] As dificuldades observadas viraram ajustes ou registro.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-vocabulario-e-textos.md) | Glossario e revisao dos textos de interface | `chore/rnf01-vocabulario-e-textos` | M |
| [issue-02](issue-02-estados-vazios-e-teste-usuario.md) | Estados vazios e verificacao com usuarios | `chore/rnf01-estados-vazios-e-teste-usuario` | M |

## 9. Dependencias

- Depende de RF09, RF11 e RF16 estarem implementados para ser verificado por
  inteiro.
- Alimentado por RF17 (feedback) e RF19 (metricas).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
