# RF13 - Geracao de Verilog a partir do circuito modelado visualmente

| Campo | Valor |
| --- | --- |
| ID | RF13 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Editor visual |
| Status | Nao implementado |
| Requisitos relacionados | RF12, RF21, RF02, RF04, RNF01 |

## 1. Enunciado

> A plataforma deve gerar codigo Verilog equivalente a partir do circuito
> modelado visualmente.

## 2. O que e

A traducao do grafo de RF12 em um modulo Verilog sintaticamente valido e
semanticamente equivalente: entradas do circuito viram portas `input`, saidas
viram `output`, e cada porta logica vira uma atribuicao continua.

Para o somador completo montado no canvas, o resultado esperado e algo como:

```verilog
module somador (
    input  wire a,
    input  wire b,
    input  wire cin,
    output wire sum,
    output wire cout
);
    wire n1, n2, n3;

    assign n1   = a ^ b;
    assign sum  = n1 ^ cin;
    assign n2   = a & b;
    assign n3   = n1 & cin;
    assign cout = n2 | n3;
endmodule
```

O ponto crucial e que o codigo gerado precisa ser **legivel**, nao apenas
correto: ele e material didatico, e o aluno vai le-lo para entender a
correspondencia entre desenho e texto.

## 3. Para que serve

E o que fecha o argumento pedagogico do editor visual. Sem RF13, o canvas e um
desenho bonito e isolado. Com RF13, o aluno monta o que entende, ve o codigo
correspondente e aprende a escrever sozinho - a mesma ideia que o SHDL, uma das
tres referencias do TCC, explora ao gerar VHDL/Verilog limpo a partir de uma
descricao de mais alto nivel.

E tambem o unico caminho para simular um circuito montado no canvas: o pipeline
de RF03/RF04 compila Verilog, entao o desenho precisa virar texto antes de
qualquer coisa.

## 4. Impacto

**Para o usuario.** Transforma o editor visual em ferramenta de aprendizado real.
Cria a ponte entre os dois modos de trabalho.

**Na arquitetura.** O gerador roda no cliente, sobre o modelo de RF12, e produz
`HdlSources` - a mesma estrutura que o editor de codigo manipula. Nada muda no
backend: o Verilog gerado entra pelo mesmo `POST /api/simulations`. E mais uma
confirmacao pratica de RNF08.

**Na relacao entre as duas fontes.** Regenerar sobrescreve o que estiver no
editor. Se o aluno montou no canvas, gerou o codigo e depois editou o texto a
mao, uma regeneracao apaga a edicao. RF12-I03 preve o hash de sincronia
justamente para detectar isso; RF13 precisa usa-lo.

**No testbench.** O gerador produz o **design**, nunca o testbench - escrever
estimulo continua sendo trabalho do usuario (RF04). Gerar um testbench automatico
seria util, mas contraria a decisao pedagogica ja tomada e fica fora do escopo.

## 5. Estado atual no repositorio

- Nao existe nada de RF12, logo nao ha grafo de onde gerar.
- `HdlSourcesSchema` (`packages/shared/src/schemas/hdl.ts`) e o formato de saida
  esperado: `language`, `topModule`, `design` e `testbench`.
- `ModuleNameSchema` (`schemas/common.ts`) ja valida identificador Verilog e
  serve para nomes de porta e de modulo.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Representacao intermediaria a partir do grafo, com ordenacao topologica.
- Emissao de Verilog legivel, formatado e comentado.
- Nomeacao previsivel de sinais intermediarios.
- Fluxo "gerar e simular" a partir do canvas, com tratamento da divergencia
  entre codigo gerado e codigo editado a mao.

**Fora**

- Geracao de testbench.
- Otimizacao logica (minimizacao, fusao de portas) - o codigo deve espelhar o
  desenho, nao melhora-lo.
- Geracao de VHDL.
- Caminho inverso: importar Verilog e desenhar o circuito.
- Construcoes sequenciais (RF21 estende esta feature).

## 7. Criterios de aceite da feature

- [ ] Um somador completo montado no canvas gera Verilog que compila sem aviso.
- [ ] O codigo gerado simula com o mesmo testbench do exemplo equivalente escrito
      a mao, produzindo a mesma saida.
- [ ] Os nomes de portas correspondem aos rotulos das entradas e saidas.
- [ ] Sinais intermediarios tem nomes previsiveis e nao colidem com portas.
- [ ] O codigo e formatado e legivel, com comentario indicando a origem.
- [ ] Circuito invalido (ciclo, entrada solta) nao gera codigo - explica o
      problema.
- [ ] Regenerar sobre codigo editado a mao pede confirmacao.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-representacao-intermediaria.md) | Representacao intermediaria e ordenacao topologica | `feat/rf13-representacao-intermediaria` | M |
| [issue-02](issue-02-emissor-verilog.md) | Emissor de Verilog legivel | `feat/rf13-emissor-verilog` | M |
| [issue-03](issue-03-fluxo-gerar-e-simular.md) | Fluxo gerar e simular a partir do canvas | `feat/rf13-fluxo-gerar-e-simular` | M |

## 9. Dependencias

- Depende inteiramente de RF12 (grafo e validacao).
- Alimenta RF04 (o codigo gerado segue pelo pipeline normal).
- Estendido por RF21 (blocos sequenciais).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
