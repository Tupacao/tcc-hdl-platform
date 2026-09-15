# RF08-I01 - Endpoint de exportacao em `.zip`

| Campo | Valor |
| --- | --- |
| Feature | [RF08](feature.md) |
| Branch | `feat/rf08-endpoint-exportacao-zip` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF07-I01 |
| Status | **Adiado.** A exportacao do MVP saiu client-side (ver
`issue-02-acao-exportar-interface.md` e a nota em `feature.md`) porque RF07-I02
decidiu manter os projetos so no `localStorage` ate RF14 (login) existir - um
endpoint `GET /api/projects/:id/export` exportaria do Postgres um projeto que a
tela real de "Meus projetos" nunca populou. Este doc fica registrado, sem
alteracao no conteudo abaixo, para quando RF14 sincronizar local -> nuvem e o
Postgres passar a ser a fonte de verdade - nesse momento a rota descrita aqui
volta a fazer sentido tal como planejada. |

## Contexto

Todas as rotas de `apps/api/src/modules/projects/routes.ts` declaram `response`
com schema Zod e devolvem JSON. Exportacao e a primeira resposta binaria da API,
o que exige sair do padrao com cuidado: `fastify-type-provider-zod` valida a
serializacao pelo schema declarado, entao a rota nao deve declarar `response`
para o `200` - apenas para os codigos de erro.

## Objetivo

Entregar `GET /api/projects/:id/export` devolvendo um `.zip` com design,
testbench e metadados, no formato que o `iverilog` local consegue compilar
direto.

## Escopo tecnico

- `apps/api/src/modules/projects/routes.ts` - nova rota
- `apps/api/src/modules/projects/export.ts` (novo) - montagem do pacote
- `apps/api/package.json` - dependencia de compactacao

## Passo a passo

1. Escolher a biblioteca. Recomendacao: uma opcao pequena e sincrona sobre
   `Buffer` (por exemplo `fflate`), suficiente para dois arquivos de texto e sem
   o peso de uma solucao de streaming. Registrar a escolha no `README.md`.
2. Montar o pacote com:
   - `<design.name>` e `<testbench.name>`, conteudo exato do projeto;
   - `project.json` com `id`, `name`, `description`, `topModule`, `language`,
     `createdAt`, `updatedAt` e a versao do formato de export;
   - `README.txt` curto, em portugues, explicando como compilar localmente
     (`iverilog -g2012 -o sim design.v tb.v && vvp sim`).
3. Sanitizar o nome do arquivo baixado: derivar do nome do projeto removendo
   acentos e caracteres invalidos em Windows (`< > : " / \ | ? *`), limitar o
   tamanho e cair para `projeto-<id>.zip` quando sobrar vazio.
4. Definir os cabecalhos: `Content-Type: application/zip` e
   `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...` (a
   forma com `filename*` preserva acento em navegadores modernos).
5. Manter `404` no formato `ApiErrorSchema`, igual as demais rotas.
6. Nao declarar schema de `response` para o `200`, e comentar o porque no codigo
   - e uma excecao consciente ao padrao do projeto.
7. Testar: gerar o pacote em memoria, descompactar no teste e conferir nomes,
   conteudo e o JSON de metadados.
8. Preparar o caminho para RNF06: a rota deve passar pela mesma verificacao de
   posse das demais rotas de projeto quando ela existir.

## Criterios de aceite

- [ ] `GET /api/projects/:id/export` devolve um `.zip` valido com os tres
      arquivos.
- [ ] O conteudo dos `.v` e byte a byte igual ao armazenado.
- [ ] `Content-Disposition` traz um nome derivado do projeto, sem caractere
      invalido.
- [ ] Projeto inexistente devolve `404` no formato padrao.
- [ ] Descompactar e rodar `iverilog` reproduz a simulacao.
- [ ] Teste automatizado descompacta e confere o conteudo.

## Verificacao

```bash
pnpm --filter @tplab/api test
pnpm typecheck
curl -OJ http://localhost:3333/api/projects/<id>/export
unzip -l <arquivo>.zip
```

## Riscos

- Declarar schema de resposta na rota binaria corrompe o arquivo em silencio,
  porque o serializador tenta transformar o buffer em JSON.
- Nome de projeto com acento gera cabecalho invalido se codificado errado; testar
  com um nome como "Somador Completo - versao final".
- Sem RNF06, qualquer pessoa exporta qualquer projeto. Aceitavel enquanto a
  plataforma nao esta publica; registrar como pendencia.
