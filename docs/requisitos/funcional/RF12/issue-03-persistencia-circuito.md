# RF12-I03 - Modelo e persistencia do circuito no projeto

| Campo | Valor |
| --- | --- |
| Feature | [RF12](feature.md) |
| Branch | `feat/rf12-persistencia-circuito` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF12-I02, RF07-I01 |

## Contexto

`ProjectSchema` guarda apenas `sources: HdlSourcesSchema`. Um circuito montado no
canvas nao tem onde ficar: fechar a aba perde o trabalho.

A questao central e como codigo e circuito coexistem em um mesmo projeto. Um
projeto pode ter sido escrito direto em Verilog, montado no canvas, ou montado no
canvas e depois editado no codigo - e nesse ultimo caso o circuito deixa de
corresponder ao codigo. Ignorar essa divergencia produz perda silenciosa de
trabalho.

## Objetivo

Definir o schema do circuito em `packages/shared`, guarda-lo junto ao projeto e
estabelecer a relacao entre circuito e codigo sem ambiguidade.

## Escopo tecnico

- `packages/shared/src/schemas/circuit.ts` (novo)
- `packages/shared/src/schemas/project.ts` - campo do circuito
- `apps/api/prisma/schema.prisma` - coluna correspondente
- `apps/web/src/features/circuit/` - serializacao a partir do modelo
- `apps/api/src/modules/projects/` - sem mudanca de rota prevista

## Passo a passo

1. Definir `CircuitSchema` em `packages/shared`, versionado desde o inicio
   (`version: z.literal(1)`): blocos, conexoes, e o formato de posicao. Manter
   limites explicitos (numero maximo de blocos e conexoes), no espirito de
   `MAX_SOURCE_BYTES`.
2. Acrescentar `circuit: CircuitSchema.nullable().default(null)` ao
   `ProjectSchema` e ao `CreateProjectSchema`. Como `UpdateProjectSchema` e
   derivado por `.partial()`, o campo entra automaticamente no `PATCH`.
3. Rodar `pnpm --filter @tplab/shared build` - api e web consomem o `dist/`.
4. No Prisma, guardar como `Json` nullable, seguindo a mesma decisao tomada para
   `sources` em RF07-I01.
5. Definir a relacao entre circuito e codigo. Recomendacao para o MVP:
   - o circuito e a fonte, o codigo gerado por RF13 e derivado;
   - guardar junto ao circuito o hash do codigo gerado na ultima sincronizacao;
   - se o codigo atual diferir desse hash, o projeto esta "fora de sincronia" e
     a interface avisa antes de regenerar, porque regenerar descarta a edicao
     manual.
6. Serializar do modelo do editor para o schema e de volta, sem carregar
   estado de renderizacao (zoom, selecao) - isso e preferencia de sessao, nao
   dado do projeto.
7. Integrar ao fluxo de salvar de RF07-I03: alterar o circuito marca o projeto
   como nao salvo, e o rascunho local tambem cobre o circuito.
8. Testar ida e volta: montar, salvar, recarregar, conferir que blocos, posicoes,
   conexoes e rotulos voltam identicos.

## Criterios de aceite

- [ ] `CircuitSchema` existe em `packages/shared` e e versionado.
- [ ] Um projeto salva e restaura o circuito integralmente.
- [ ] Projetos antigos, sem circuito, continuam abrindo (`null`).
- [ ] Alterar o circuito marca o projeto como nao salvo.
- [ ] O estado de sincronia entre circuito e codigo e detectavel.
- [ ] Zoom e selecao nao sao persistidos como dado do projeto.
- [ ] As rotas de projeto nao mudaram de assinatura.

## Verificacao

```bash
pnpm --filter @tplab/shared build
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: montar, salvar, recarregar e comparar o canvas.

## Riscos

- Um circuito grande dentro do mesmo `Json` do projeto engorda cada `GET`;
  para o tamanho previsto e aceitavel, mas a listagem nao deve trazer o circuito
  - conferir se `ProjectListSchema` precisa de uma projecao mais enxuta.
- Sem o campo de versao desde o inicio, qualquer mudanca de formato quebra
  projetos salvos; por isso ele entra ja na primeira versao.
