# RF02 - Editor de codigo Verilog com destaque de sintaxe

| Campo | Valor |
| --- | --- |
| ID | RF02 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Edicao de codigo |
| Status | Parcial (Monaco integrado; falta linguagem propria e ergonomia) |
| Requisitos relacionados | RF05, RF09, RF10, RF18, RNF01, RNF09 |

## 1. Enunciado

> A plataforma deve fornecer um editor de codigo Verilog com destaque de sintaxe.

## 2. O que e

E a superficie principal de trabalho do usuario: uma area de edicao de texto com
consciencia da linguagem Verilog. "Destaque de sintaxe" e o piso; o que se espera
de um editor moderno e um conjunto minimo indissociavel disso:

- coloracao de palavras-chave, tipos, numeros, strings, diretivas e comentarios;
- numeracao de linhas (pre-requisito de RF05, que aponta erros por linha);
- comentario de linha e de bloco por atalho;
- auto-fechamento e destaque de pares (`begin`/`end`, parenteses, colchetes);
- indentacao consistente e busca dentro do arquivo;
- alternancia entre os arquivos do projeto (design e testbench).

A escolha de stack ja feita e o **Monaco Editor** (o mesmo do VS Code), carregado
do bundle local, nunca de CDN, porque a plataforma precisa funcionar em rede
restrita de laboratorio.

## 3. Para que serve

Quem escreve HDL pela primeira vez confunde `wire` com `reg`, esquece `end` e
erra a posicao do `;`. O destaque de sintaxe transforma esses erros em algo
visivel *antes* de compilar: um `begin` sem par tem cor diferente, uma string nao
fechada "vaza" a cor pelo resto do arquivo. E o feedback mais barato que existe -
custa zero chamada ao servidor - e reduz a quantidade de ciclos de compilacao
gastos com erro trivial.

## 4. Impacto

**Para o usuario.** Reduz erro de digitacao, encurta o ciclo de tentativa e
aproxima a experiencia do que o estudante ja vera em ferramentas profissionais
(RNF01: familiaridade e simplicidade).

**Na arquitetura.** O Monaco e a maior dependencia do frontend. Ja esta isolado
em chunk proprio pelo Vite (`apps/web/vite.config.ts`) e carregado por
`apps/web/src/lib/monaco.ts`, que importa apenas a contribuicao
`systemverilog` das basic-languages, em vez das ~90 linguagens. Qualquer
evolucao (autocomplete RF18, marcadores de erro RF05) se pendura nessa mesma
instancia.

**Em requisitos vizinhos.** RF05 depende do editor expor markers e navegacao por
linha. RF10 exige tema do editor sincronizado com o tema da aplicacao. RF18
(autocomplete) e uma extensao direta do provider de linguagem. RNF09 exige que a
paleta de cores do editor tenha contraste AA nos dois temas.

## 5. Estado atual no repositorio

- `apps/web/src/lib/monaco.ts` configura o loader local e exporta
  `VERILOG_LANGUAGE_ID = 'verilog'`, obtido da contribuicao `systemverilog`.
- `apps/web/src/features/workspace/code-editor.tsx` renderiza o editor.
- `apps/web/src/features/workspace/workspace.tsx` mantem `sources` com duas abas
  (`design` e `testbench`), tipadas por `HdlSourcesSchema`.
- **Falta**: tema do editor amarrado ao tema da aplicacao, opcoes de ergonomia
  explicitas, verificacao do destaque contra construcoes reais de Verilog e
  ausencia de estado "arquivo nao salvo".

## 6. Escopo

**Dentro**

- Destaque de sintaxe correto para Verilog-2001 e construcoes usuais de
  testbench (`$display`, `$dumpvars`, `initial`, `always`, delays `#10`).
- Configuracao do editor: numeracao, indentacao, pares, comentario por atalho,
  quebra de linha, tamanho de fonte legivel.
- Sincronizacao do tema claro/escuro com o tema global.
- Alternancia entre design e testbench sem perder o conteudo digitado.

**Fora**

- Autocomplete (RF18) e formatador automatico.
- Marcadores de erro no editor (RF05).
- Suporte a VHDL/SystemVerilog completo (fora do MVP).

## 7. Criterios de aceite da feature

- [ ] Um arquivo Verilog representativo exibe palavras-chave, tipos, numeros com
      base (`4'b1010`), comentarios `//` e `/* */` e tarefas de sistema (`$...`)
      com cores distintas.
- [ ] O editor mostra numeros de linha e destaca o par de `begin`/`end`.
- [ ] Alternar entre design e testbench preserva conteudo, cursor e scroll.
- [ ] O tema do editor acompanha a alternancia claro/escuro sem recarregar a
      pagina.
- [ ] Nenhuma requisicao a CDN externa e feita ao abrir o editor.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-linguagem-verilog-monaco.md) | Validar e ajustar a definicao de linguagem Verilog no Monaco | `feat/rf02-linguagem-verilog-monaco` | M |
| [issue-02](issue-02-tema-e-ergonomia-editor.md) | Tema sincronizado e opcoes de ergonomia do editor | `feat/rf02-tema-e-ergonomia-editor` | P |
| [issue-03](issue-03-abas-design-testbench.md) | Abas de arquivo com preservacao de estado por arquivo | `feat/rf02-abas-design-testbench` | M |

## 9. Dependencias

- Nao depende de backend.
- Bloqueia RF05 (markers), RF18 (autocomplete) e parte de RF09.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
