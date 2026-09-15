# RF11 - Documentacao estatica: guia de inicio rapido e referencia de sintaxe

| Campo | Valor |
| --- | --- |
| ID | RF11 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Conteudo educacional |
| Status | Parcial — I01 (navegacao e layout) concluida; I02 (guia de inicio rapido) e I03 (referencia de sintaxe) pendentes |
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

**Na navegacao.** E o que provavelmente obriga a introduzir roteamento no SPA -
`App.tsx` hoje renderiza `<Workspace />` direto. Alternativa: painel lateral ou
dialogo sobre o workspace, coerente com a promessa de interface unica de RF09.
A decisao precisa ser tomada uma vez e valer tambem para RF07-I02.

**No custo de manutencao.** Documentacao envelhece. O guia cita atalhos
(RF09-I02), limites (RF03-I01) e o contrato do testbench (RF04-I01): sempre que
esses mudarem, o texto precisa mudar junto. Derivar o que for possivel da mesma
fonte de dados reduz a divergencia.

**Na relacao com RF16.** O tutorial guiado mostra *onde clicar*; a documentacao
explica *o que significa*. Sao complementares, e o guia de inicio rapido e a base
do roteiro do tour.

## 5. Estado atual no repositorio

- `apps/web/src/features/docs/`: painel lateral (`Sheet`) com indice, busca
  por titulo/resumo e area de leitura, montado em `Workspace` e em
  `ProjectsPage` - acessivel de qualquer tela, sem roteador. Uma secao de
  conteudo ("Exemplo: somador completo") prova o mecanismo de copiar/abrir no
  editor.
- `apps/web/src/components/ui/sheet.tsx`: componente shadcn/ui novo, sobre
  `@radix-ui/react-dialog` (ja dependencia) - nenhum pacote novo instalado.
- `apps/web/src/lib/samples.ts` tem o exemplo do somador completo, com testbench
  usando `$dumpfile`/`$dumpvars` - ja reaproveitado na secao de exemplo.
- **Falta**: os dois textos de verdade - guia de inicio rapido (I02) e
  referencia de sintaxe (I03).

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
- [ ] O guia leva um usuario sem conhecimento previo da tela inicial ate uma
      forma de onda visivel. _(I02)_
- [ ] A referencia cobre os elementos usados pelos exemplos de RF20. _(I03)_
- [x] Os exemplos de codigo sao copiaveis e podem ser abertos no editor. _(I01,
      mecanismo pronto; mais exemplos entram com I02/I03)_
- [x] O conteudo e legivel nos dois temas, com contraste AA. _(I01)_
- [x] A navegacao funciona so por teclado e a estrutura de titulos e correta.
      _(I01)_
- [x] Abrir a documentacao nao descarta o codigo em edicao. _(I01)_

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-navegacao-e-layout-docs.md) | Navegacao e layout da documentacao | `feat-RF11-01-navegacao-e-layout-docs-front` | M | Concluido |
| [issue-02](issue-02-guia-inicio-rapido.md) | Conteudo do guia de inicio rapido | `feat/rf11-guia-inicio-rapido` | M | Pendente |
| [issue-03](issue-03-referencia-sintaxe-verilog.md) | Conteudo da referencia de sintaxe Verilog | `feat/rf11-referencia-sintaxe-verilog` | M | Pendente |

## 9. Dependencias

- Depende da decisao de navegacao compartilhada com RF07-I02.
- Alimenta RF16 (roteiro do tutorial) e usa os exemplos de RF20.
- Documenta o contrato de RF04-I01 e os atalhos de RF09-I02.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
