# RF08 - Exportacao de projetos em formato compactado

| Campo | Valor |
| --- | --- |
| ID | RF08 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Gestao de projetos |
| Status | Nao implementado |
| Requisitos relacionados | RF07, RF11, RNF06 |

## 1. Enunciado

> O usuario deve poder exportar seus projetos em formato compactado, contendo o
> codigo-fonte e o testbench.

## 2. O que e

Um botao que baixa um `.zip` com o conteudo do projeto: o arquivo de design, o
testbench e um pequeno arquivo de metadados. E a saida da plataforma - o caminho
para levar o trabalho para fora.

O conteudo minimo, derivado do enunciado, e o par de arquivos de
`HdlSourcesSchema`. Junto vale incluir um `README.txt` ou `project.json` com nome,
descricao, modulo de topo e data - informacao que existe no `ProjectSchema` mas
nao dentro dos arquivos `.v`.

## 3. Para que serve

Tres usos concretos:

1. **Entrega de trabalho.** O aluno precisa anexar o codigo em um formulario da
   disciplina.
2. **Continuidade fora da plataforma.** Quem passar a usar Vivado ou Quartus leva
   os arquivos e continua - a plataforma nao aprisiona o trabalho.
3. **Backup.** Enquanto RF14 (conta) nao existir, exportar e a unica garantia
   real de que o trabalho sobrevive.

Ha tambem uma razao de projeto: uma ferramenta educacional que nao deixa sair
perde confianca. Exportar em formato aberto e barato de implementar e vale mais
que o custo.

## 4. Impacto

**Para o usuario.** Fecha o ciclo. Baixa impedancia com o resto do mundo:
`.v` e texto, `.zip` abre em qualquer lugar.

**Na arquitetura.** Decisao a tomar: gerar o `.zip` no servidor ou no navegador.

- *No servidor*: rota `GET /api/projects/:id/export`, resposta
  `application/zip`. Vantagem: funciona igual em qualquer navegador, respeita a
  autorizacao de RNF06 e serve tambem para RF15. Custo: uma dependencia de
  compactacao na API.
- *No navegador*: monta o zip a partir do estado local. Vantagem: exporta tambem
  o rascunho nao salvo, sem passar pelo servidor. Custo: dependencia no bundle e
  duplicacao da regra de nomes.

**Recomendacao**: servidor, com a rota como fonte unica. O caso "exportar sem
salvar" se resolve pedindo para salvar antes, que e mais simples de explicar do
que duas implementacoes divergentes.

**No custo.** `docs/PROJECT_CONTEXT.md` cita Azure Blob Storage para exports.
Para o volume do MVP isso e desnecessario: gerar em memoria e transmitir na
resposta evita armazenamento, limpeza e mais um servico para operar. Registrar a
divergencia em relacao ao documento original.

## 5. Estado atual no repositorio

- Nao ha rota de exportacao em `apps/api/src/modules/projects/routes.ts`.
- Nao ha dependencia de compactacao em `apps/api/package.json` nem em
  `apps/web/package.json`.
- `ProjectSchema` ja carrega tudo o que precisa entrar no pacote.
- **Falta**: a rota, a montagem do arquivo e a acao na interface.

## 6. Escopo

**Dentro**

- Rota de exportacao devolvendo `.zip` com design, testbench e metadados.
- Acao de exportar na lista de projetos e no workspace.
- Nome de arquivo previsivel e seguro.

**Fora**

- Importar `.zip` de volta.
- Exportar varios projetos de uma vez.
- Incluir formas de onda, logs ou resultados de simulacao no pacote.
- Armazenamento do arquivo gerado (nao ha persistencia do export).

## 7. Criterios de aceite da feature

- [ ] Exportar um projeto baixa um `.zip` valido, que abre no Windows, macOS e
      Linux sem ferramenta extra.
- [ ] O pacote contem o design, o testbench e um arquivo de metadados legivel.
- [ ] Os nomes dentro do pacote sao os mesmos exibidos nas abas do editor.
- [ ] O nome do arquivo baixado deriva do nome do projeto, sem caractere invalido.
- [ ] Exportar projeto inexistente devolve `404` no formato `ApiErrorSchema`.
- [ ] Descompactar e rodar `iverilog` nos arquivos reproduz a simulacao.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-endpoint-exportacao-zip.md) | Endpoint de exportacao em `.zip` | `feat/rf08-endpoint-exportacao-zip` | M |
| [issue-02](issue-02-acao-exportar-interface.md) | Acao de exportar na interface | `feat/rf08-acao-exportar-interface` | P |

## 9. Dependencias

- Depende de RF07 (nao ha o que exportar sem projeto persistido).
- Sera restringido por RNF06 quando houver dono de projeto: exportar projeto
  alheio nao pode ser possivel.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
