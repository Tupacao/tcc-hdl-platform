# RF08 - Exportacao de projetos em formato compactado

| Campo | Valor |
| --- | --- |
| ID | RF08 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Gestao de projetos |
| Status | Concluido — client-side (I02); o endpoint de servidor original (I01) ficou adiado, ver nota abaixo |
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

**Recomendacao original**: servidor, com a rota como fonte unica. O caso
"exportar sem salvar" se resolveria pedindo para salvar antes.

**Decisao tomada no MVP (revisao desta secao)**: client-side, nao servidor.
Entre a escrita deste documento e a implementacao, RF07-I02 decidiu manter os
projetos so no `localStorage` ate RF14 (login) existir - a tela real de "Meus
projetos" nunca envia nada para `/api/projects`, entao uma rota de export no
Postgres exportaria dados que a interface nunca populou. A alternativa
"navegador" do paragrafo acima deixou de ser so uma opcao valida e virou a
unica que corresponde ao que a plataforma realmente persiste hoje. Efeito
colateral positivo: o caso "exportar sem salvar" fica resolvido de graca -
sem servidor no meio, o workspace exporta as fontes ao vivo do editor, alteracoes
nao salvas inclusas, sem pedir para salvar antes.

`GET /api/projects/:id/export` (RF08-I01) fica documentado e adiado, nao
descartado: quando RF14 sincronizar local -> nuvem e o Postgres virar a fonte
de verdade dos projetos, a rota original volta a fazer sentido tal como
planejada - inclusive para servir RF15 (compartilhamento), que precisa de um
projeto no servidor de qualquer forma.

**No custo.** `docs/PROJECT_CONTEXT.md` cita Azure Blob Storage para exports.
Isso deixou de se aplicar tambem: sem rota de servidor, nao ha nada para
armazenar - o `.zip` e montado e descartado inteiramente no navegador.

## 5. Estado atual no repositorio

- `apps/web/src/features/projects/utils/export-project.ts`: monta o `.zip` em
  memoria com `fflate` (design, testbench, `project.json`, `README.txt`) e
  dispara o download via `Blob`/`URL.createObjectURL`.
- Acao "Exportar" no menu do card (`ProjectActionsMenu`, exporta
  `project.sources`, a versao salva) e no cabecalho do workspace
  (`WorkspaceHeader`, exporta as fontes ao vivo do editor - RF07-I03).
- Nao ha rota de exportacao em `apps/api/src/modules/projects/`
  (`RF08-I01`, adiado - ver nota acima e o doc do issue).

## 6. Escopo

**Dentro**

- Montagem do `.zip` (design, testbench, metadados) e a acao de exportar na
  lista de projetos e no workspace - client-side, ver nota da secao 4.
- Nome de arquivo previsivel e seguro.

**Fora**

- Importar `.zip` de volta.
- Exportar varios projetos de uma vez.
- Incluir formas de onda, logs ou resultados de simulacao no pacote.
- Armazenamento do arquivo gerado (nao ha persistencia do export).
- Endpoint de servidor (RF08-I01) - documentado, adiado para quando RF14
  existir.

## 7. Criterios de aceite da feature

- [x] Exportar um projeto baixa um `.zip` valido, que abre no Windows, macOS e
      Linux sem ferramenta extra.
- [x] O pacote contem o design, o testbench e um arquivo de metadados legivel.
- [x] Os nomes dentro do pacote sao os mesmos exibidos nas abas do editor.
- [x] O nome do arquivo baixado deriva do nome do projeto, sem caractere invalido.
- [x] Descompactar e rodar `iverilog` nos arquivos reproduz a simulacao.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho | Status |
| --- | --- | --- | --- | --- |
| [issue-01](issue-01-endpoint-exportacao-zip.md) | Endpoint de exportacao em `.zip` | `feat/rf08-endpoint-exportacao-zip` | M | Adiado |
| [issue-02](issue-02-acao-exportar-interface.md) | Exportacao de projeto em `.zip` (client-side) | `feat-RF08-02-acao-exportar-interface-front` | P | Concluido |

## 9. Dependencias

- Depende de RF07 (nao ha o que exportar sem projeto criado).
- RF08-I01 (servidor) depende de RF14 fazer do Postgres a fonte de verdade dos
  projetos antes de fazer sentido implementa-lo.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
