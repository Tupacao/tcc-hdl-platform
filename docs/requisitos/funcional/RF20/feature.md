# RF20 - Projetos de exemplo pre-carregados

| Campo | Valor |
| --- | --- |
| ID | RF20 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Could Have |
| Epico | Conteudo educacional |
| Status | Parcial (ha um exemplo unico; falta o catalogo) |
| Requisitos relacionados | RF07, RF11, RF16, RNF01 |

## 1. Enunciado

> A plataforma deve disponibilizar projetos de exemplo pre-carregados, como
> somador, multiplexador e contador.

## 2. O que e

Uma colecao de projetos prontos - design mais testbench - que o usuario abre com
um clique, executa e estuda. O enunciado cita tres, que nao sao aleatorios:
somador (combinacional aritmetico), multiplexador (combinacional de selecao) e
contador (sequencial, com clock e reset). Juntos cobrem os tres tipos de circuito
que aparecem no inicio de qualquer disciplina de sistemas digitais.

Cada exemplo precisa ser completo: compilar sem aviso, simular ate `$finish`,
produzir formas de onda e ter comentarios que expliquem o que esta acontecendo.

## 3. Para que serve

Tres funcoes distintas:

1. **Ponto de partida.** Uma tela vazia paralisa quem nao sabe o que escrever.
   Codigo funcionando na tela convida a modificar - e modificar e como se aprende.
2. **Material de referencia.** Um contador correto e a melhor documentacao de
   como se escreve um `always @(posedge clk)`.
3. **Demonstracao.** O caminho mais rapido para mostrar a plataforma funcionando,
   em aula ou na defesa, e abrir um exemplo e executar.

O comentario em `apps/web/src/lib/samples.ts` ja registra RF20 como motivacao do
exemplo unico que existe hoje.

## 4. Impacto

**Para o usuario.** Elimina a tela em branco e da referencia correta de estilo.

**Na integracao.** Amarra tres requisitos: e o conteudo que RF16 (tour) usa para
ter algo na tela, o que RF11 (documentacao) referencia nos exemplos, e o que
RF07 (projetos) oferece na criacao.

**Na manutencao.** Exemplo quebrado e pior que exemplo ausente: destroi a
confianca na ferramenta no primeiro contato. Isso exige verificacao automatizada
- os exemplos precisam ser compilados como parte da verificacao, nao conferidos a
mao de vez em quando.

**No que ja existe.** `SAMPLE_SOURCES` e um objeto unico, carregado direto no
estado inicial do `Workspace`. Virar catalogo exige mudar a estrutura, mas o
formato do conteudo ja esta certo: `HdlSources` com design e testbench.

## 5. Estado atual no repositorio

- `apps/web/src/lib/samples.ts` exporta `SAMPLE_SOURCES`, um unico `HdlSources`
  com o somador completo (`full_adder.v` + testbench). O comentario do arquivo ja
  cita RF20.
- O testbench do exemplo e um bom modelo: instancia por nome, usa `$dumpfile`,
  `$dumpvars`, laco de estimulos, `$display` formatado e `$finish`.
- `workspace.tsx` usa `useState<HdlSources>(SAMPLE_SOURCES)` - o exemplo e o
  estado inicial, nao uma escolha do usuario.
- **Falta**: o catalogo com os demais exemplos, a interface de escolha e a
  verificacao automatizada.

## 6. Escopo

**Dentro**

- Catalogo com no minimo somador, multiplexador e contador.
- Metadados por exemplo: titulo, descricao, conceitos abordados, dificuldade.
- Interface para escolher e abrir um exemplo.
- Verificacao automatizada de que todos compilam e simulam.

**Fora**

- Exercicios com verificacao automatica de resposta (Won't Have: gestao
  educacional).
- Exemplos contribuidos por usuarios.
- Exemplos em VHDL ou SystemVerilog.
- Trilha ordenada de aprendizagem.

## 7. Criterios de aceite da feature

- [ ] Ha ao menos os tres exemplos citados no enunciado.
- [ ] Todos compilam sem aviso e simulam ate o fim.
- [ ] Todos produzem `.vcd` com formas de onda visiveis.
- [ ] Cada exemplo tem titulo, descricao e conceitos abordados.
- [ ] O usuario escolhe e abre um exemplo em ate dois cliques.
- [ ] Abrir um exemplo com trabalho na tela pede confirmacao.
- [ ] Ha verificacao automatizada de que os exemplos continuam validos.
- [ ] O codigo dos exemplos e comentado em portugues.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-catalogo-de-exemplos.md) | Catalogo de exemplos e verificacao automatizada | `feat/rf20-catalogo-de-exemplos` | M |
| [issue-02](issue-02-seletor-de-exemplos.md) | Seletor de exemplos na interface | `feat/rf20-seletor-de-exemplos` | P |

## 9. Dependencias

- Independente de backend para o catalogo; integra-se a RF07 na criacao de
  projeto.
- Fornece conteudo para RF11 e RF16.
- RF21 (sequenciais no editor visual) reaproveita o contador.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
