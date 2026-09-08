# RF18 - Autocompletar para palavras-chave da linguagem Verilog

| Campo | Valor |
| --- | --- |
| ID | RF18 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Could Have |
| Epico | Edicao de codigo |
| Status | Nao implementado |
| Requisitos relacionados | RF02, RF05, RF11, RNF01 |

## 1. Enunciado

> A plataforma deve oferecer sugestoes de autocompletar para palavras-chave da
> linguagem Verilog.

## 2. O que e

Sugestoes que aparecem enquanto o usuario digita, oferecendo palavras-chave
(`module`, `always`, `begin`, `assign`), tarefas de sistema (`$display`,
`$dumpvars`, `$finish`) e, quando possivel, os identificadores ja declarados no
proprio arquivo.

Tecnicamente e um `CompletionItemProvider` registrado no Monaco para a linguagem
`verilog` - o id que `apps/web/src/lib/monaco.ts` ja exporta como
`VERILOG_LANGUAGE_ID`.

## 3. Para que serve

Duas funcoes, e a segunda importa mais para o publico do TPLab:

1. **Digitar menos.** Beneficio comum a qualquer editor.
2. **Descobrir a linguagem.** Quem esta aprendendo nao sabe que `$dumpvars`
   existe. Uma lista que aparece ao digitar `$` ensina o vocabulario no momento
   em que ele e necessario, sem sair da tela.

E tambem prevencao de erro: sugerir `$dumpfile` evita o `$dumpFile` que nao
compila, e completar identificadores ja declarados evita o erro de digitacao no
nome do sinal - uma das causas mais comuns de `Unknown module type` e afins
(RF05-I03).

## 4. Impacto

**Para o usuario.** Reduz erro trivial e encurta o ciclo de tentativa.

**Na arquitetura.** Nenhum impacto no backend: e inteiramente frontend, pendurado
na instancia do Monaco que RF02 ja configura. Nao adiciona dependencia.

**No risco.** Baixo e contido: se o provider falhar, o editor continua
funcionando sem sugestao. E o que justifica a classificacao Could Have - alto
valor percebido, custo pequeno, risco quase nulo.

**No que nao deve virar.** Autocompletar por analise semantica completa exigiria
um parser de Verilog no navegador - trabalho desproporcional ao ganho e fora do
escopo do MVP. O alvo e a lista estatica mais os identificadores do arquivo por
analise textual.

## 5. Estado atual no repositorio

- `apps/web/src/lib/monaco.ts` importa a contribuicao `systemverilog` das
  basic-languages, que registra os ids `verilog` e `systemverilog`, e exporta
  `VERILOG_LANGUAGE_ID = 'verilog'`.
- As basic-languages fornecem tokenizacao e coloracao, mas **nao** fornecem
  provider de autocompletar - o Monaco oferece apenas sugestao por palavras do
  documento, sem conhecimento da linguagem.
- `apps/web/src/features/workspace/code-editor.tsx` monta o editor e ja guarda
  `monacoRef`, o que da o ponto de registro do provider.
- **Falta**: o provider, o catalogo de palavras-chave e os snippets.

## 6. Escopo

**Dentro**

- Palavras-chave de Verilog-2001 e tarefas de sistema usuais.
- Identificadores declarados no arquivo atual (analise textual).
- Snippets das construcoes mais comuns, com pontos de parada.
- Documentacao curta em cada sugestao.

**Fora**

- Analise semantica, resolucao de escopo e verificacao de tipos.
- Sugestao entre arquivos (design conhecendo o testbench).
- Formatacao automatica e refatoracao.
- Sugestao assistida por modelo de linguagem (Won't Have).

## 7. Criterios de aceite da feature

- [ ] Digitar as primeiras letras de uma palavra-chave oferece a sugestao.
- [ ] Digitar `$` lista as tarefas de sistema com descricao.
- [ ] Nomes de sinais e modulos declarados no arquivo aparecem entre as
      sugestoes.
- [ ] Snippets de `module`, `always` e testbench inserem estrutura com pontos de
      parada.
- [ ] Cada sugestao traz uma descricao curta em portugues.
- [ ] Sugestoes nao aparecem dentro de comentario ou string.
- [ ] O editor continua funcionando se o provider falhar.
- [ ] Nenhuma dependencia nova e adicionada.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-provider-palavras-chave.md) | Provider de autocompletar com palavras-chave e tarefas de sistema | `feat/rf18-provider-palavras-chave` | M |
| [issue-02](issue-02-snippets-e-identificadores.md) | Snippets e identificadores do arquivo | `feat/rf18-snippets-e-identificadores` | M |

## 9. Dependencias

- Depende de RF02 (editor configurado) e se beneficia de RF02-I03 (modelo por
  arquivo).
- Reaproveita o vocabulario de RF11-I03 (referencia de sintaxe).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
