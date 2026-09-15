# RF11 - Documentacao estatica: guia de inicio rapido e referencia de sintaxe

| Campo | Valor |
| --- | --- |
| ID | RF11 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Conteudo educacional |
| Status | Parcial — I01 (navegacao e layout) e I02 (guia de inicio rapido) concluidas; I03 (referencia de sintaxe) pendente |
| Requisitos relacionados | RF02, RF04, RF16, RF20, RNF01, RNF09 |

## 1. Enunciado

> A plataforma deve disponibilizar documentacao estatica contendo guia de inicio
> rapido e referencia basica de sintaxe.

## 2. O que e

Duas pecas de conteudo dentro da propria aplicacao:

1. **Guia de inicio rapido** - o caminho minimo da primeira visita ate a primeira
   forma de onda: o que e cada painel, o que escrever no design, o que escrever
   no testbench, como executar e como ler o resultado.
2. **Referencia basica de sintaxe** - uma folha de consulta de Verilog para quem
   esta aprendendo: declaracao de modulo, portas, `wire` e `reg`, operadores,
   `assign`, `always`, blocos `initial`, numeros com base, e as tarefas de sistema
   que o fluxo exige (`$dumpfile`, `$dumpvars`, `$display`, `$finish`).

"Estatica" e uma decisao de escopo: conteudo escrito e versionado no repositorio,
sem CMS, sem editor, sem banco.

## 3. Para que serve

O publico-alvo nao sabe Verilog. Sem referencia acessivel dentro da ferramenta, o
aluno alterna entre a plataforma e uma busca na internet, onde encontra material
para engenheiro experiente ou exemplos de SystemVerilog que o Icarus nao aceita.

O guia tambem cobre o que e especifico do TPLab e nao existe em tutorial nenhum:
o contrato do testbench (RF04-I01) - o `$dumpfile`/`$dumpvars` obrigatorio para
haver forma de onda, e o fato de que a plataforma escolhe o topo automaticamente.
Sem isso o aluno interpreta comportamento esperado como defeito.

## 4. Impacto

**Para o usuario.** Reduz o abandono no primeiro contato e o numero de duvidas
que dependem do professor.

**Na navegacao.** Decisao ja fechada no Figma (`figma/WILL-BE-DONE.md`):
documentacao e **pagina propria**, nao painel/dialogo sobre o workspace. Isso
nao exigiu roteador - `App.tsx` ja tinha o precedente de 'projects' como uma
terceira `view` trocada por estado, sem URL propria; 'docs' seguiu o mesmo
padrao (I01).

**No custo de manutencao.** Documentacao envelhece. O guia cita atalhos
(RF09-I02), limites (RF03-I01) e o contrato do testbench (RF04-I01): sempre que
esses mudarem, o texto precisa mudar junto. Derivar o que for possivel da mesma
fonte de dados reduz a divergencia.

**Na relacao com RF16.** O tutorial guiado mostra *onde clicar*; a documentacao
explica *o que significa*. Sao complementares, e o guia de inicio rapido e a base
do roteiro do tour.

## 5. Estado atual no repositorio

- `apps/web/src/features/docs/`: pagina propria (`DocsPage`, terceira `view`
  de `App.tsx`), indice agrupado por categoria (Inicio rapido/Referencia/
  Ajuda), busca por titulo/resumo com redirecionamento para termos fora de
  escopo, navegacao Anterior/Proximo.
- `apps/web/src/features/workspace/components/open-example-dialog.tsx`:
  dialogo "Onde abrir" (Figma 7.6) quando "Abrir no editor" e clicado com um
  projeto aberto - abrir como projeto novo (padrao) ou substituir o conteudo
  atual (`overrideSources` em `use-project-link.ts`).
- `content/inicio-rapido.tsx` (I02): guia "Primeiro projeto" completo - mapa
  da tela, arquivo de design, arquivo de testbench (contrato de
  `$dumpfile`/`$dumpvars`/`$finish`), executar e ler o console, ler a forma
  de onda, tres erros mais comuns com texto real de console (capturado
  rodando `iverilog` contra o exemplo quebrado de proposito). Atalhos de
  teclado ficaram de fora - RF09-I02 nao existe ainda.
- `content/o-que-nao-faz.tsx` (I01): "O que o TP Lab nao faz" (Figma 7.3).
- **Falta**: a referencia de sintaxe (I03); o link profundo do console de
  diagnosticos para uma ancora especifica da documentacao (Figma 7.2/7.6,
  RF05 × RF11 - registrado em `docs/requisitos/funcional/RF05/feature.md`).

## 6. Escopo

**Dentro**

- Superficie de documentacao dentro da aplicacao, com indice e busca simples.
- Guia de inicio rapido, com o fluxo completo ate a primeira forma de onda.
- Referencia basica de sintaxe Verilog voltada a iniciantes.
- Exemplos copiaveis, e quando possivel "abrir no editor".

**Fora**

- Curso ou trilha de aprendizagem (Won't Have: gestao educacional).
- Documentacao de API para desenvolvedores.
- Conteudo em outros idiomas (Won't Have: internacionalizacao).
- Referencia completa da linguagem - o objetivo e o basico util, nao o LRM.

## 7. Criterios de aceite da feature

- [x] A documentacao e alcancavel de qualquer ponto da aplicacao. _(I01)_
- [x] O guia leva um usuario sem conhecimento previo da tela inicial ate uma
      forma de onda visivel. _(I02 - validacao com pessoa de fora ainda
      pendente, ver issue-02)_
- [ ] A referencia cobre os elementos usados pelos exemplos de RF20. _(I03)_
- [x] Os exemplos de codigo sao copiaveis e podem ser abertos no editor.
      _(I01/I02)_
- [x] O conteudo e legivel nos dois temas, com contraste AA. _(I01)_
- [x] A navegacao funciona so por teclado e a estrutura de titulos e correta.
      _(I01)_
- [x] Abrir a documentacao nao descarta o codigo em edicao. _(I01)_

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-navegacao-e-layout-docs.md) | Navegacao e layout da documentacao | `feat-RF11-01-navegacao-e-layout-docs-front` | M | Concluido |
| [issue-02](issue-02-guia-inicio-rapido.md) | Conteudo do guia de inicio rapido | `feat-RF11-02-guia-inicio-rapido-front` | M | Concluido |
| [issue-03](issue-03-referencia-sintaxe-verilog.md) | Conteudo da referencia de sintaxe Verilog | `feat/rf11-referencia-sintaxe-verilog` | M | Pendente |

## 9. Dependencias

- Depende da decisao de navegacao compartilhada com RF07-I02.
- Alimenta RF16 (roteiro do tutorial) e usa os exemplos de RF20.
- Documenta o contrato de RF04-I01 e os atalhos de RF09-I02.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
