# RNF04-I02 - Reducao da exposicao do socket do Docker

| Campo | Valor |
| --- | --- |
| Feature | [RNF04](feature.md) |
| Branch | `feat/rnf04-exposicao-docker-socket` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RNF04-I01 |

## Contexto

`infra/docker-compose.yml` monta no worker:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  - /tmp:/tmp
```

O primeiro e o que permite ao worker criar os containers de simulacao - e e a
maior divida de seguranca do projeto. Acesso ao socket do Docker equivale a
`root` no host: quem o alcanca pode criar um container privilegiado com o
sistema de arquivos do host montado.

O isolamento de RNF04 protege contra o **codigo do usuario**. Nao protege contra
uma falha no proprio worker: uma vulnerabilidade em qualquer dependencia do
processo Node vira comprometimento total da VM.

O segundo volume tambem merece nota: os fontes do usuario passam pelo `/tmp` do
host, porque o bind do container de simulacao e resolvido pelo daemon.

## Objetivo

Reduzir a superficie do acesso ao Docker ao minimo necessario, ou registrar
formalmente o risco aceito com as compensacoes adotadas.

## Escopo tecnico

- `infra/docker-compose.yml` - servico intermediario e volumes
- `apps/api/src/modules/simulation/sandbox.ts` - endereco do daemon
- `apps/api/src/config/env.ts` - `DOCKER_HOST` configuravel
- `docs/SEGURANCA.md` - decisao registrada

## Passo a passo

1. Avaliar as alternativas e escolher com criterio explicito:
   - **proxy de socket** (por exemplo `tecnativa/docker-socket-proxy`): um
     container intermediario que expoe apenas os endpoints necessarios
     (`POST /containers/create`, `start`, `wait`, `logs`, `remove`) e recusa o
     resto. Custo baixo, ganho alto - **recomendado**;
   - **daemon rootless**: elimina o `root` do host, mas complica o bind de
     volumes e o desempenho;
   - **manter como esta** e documentar o risco aceito, com as compensacoes.
2. Levantar exatamente quais chamadas o `dockerode` faz em `runInSandbox`:
   criar, iniciar, aguardar, ler logs e remover. Essa lista e a base da regra do
   proxy.
3. Implementar o proxy no compose, com apenas essas permissoes, e apontar o
   worker para ele via `DOCKER_HOST`, tornando o endereco configuravel em
   `env.ts` em vez de fixo no `new Docker()`.
4. Confirmar que o proxy nao permite: criar container privilegiado, montar
   volume arbitrario, executar `exec` em container existente, listar todos os
   containers do host.
5. Rever o volume `/tmp`: avaliar substituir por um diretorio dedicado
   (`/var/lib/tplab/work`) com permissao restrita, em vez do `/tmp` compartilhado
   do host. Menos superficie e mais clareza sobre onde o codigo do usuario passa.
6. Documentar em `docs/SEGURANCA.md` a decisao, o que ficou protegido, o que
   permanece exposto e por que.
7. Verificar que o fluxo completo continua funcionando apos a mudanca, e refazer
   os casos de RNF04-I01.

## Criterios de aceite

- [ ] O worker nao tem mais acesso direto ao socket do Docker, ou o risco esta
      formalmente registrado com compensacoes.
- [ ] Se houver proxy, ele permite apenas as operacoes levantadas.
- [ ] Tentar criar container privilegiado pelo proxy falha.
- [ ] Tentar montar volume arbitrario pelo proxy falha.
- [ ] O endereco do daemon e configuravel por variavel de ambiente.
- [ ] O volume `/tmp` foi revisto ou justificado.
- [ ] O fluxo completo de simulacao continua funcionando.
- [ ] A decisao esta documentada em `docs/SEGURANCA.md`.

## Verificacao

```bash
pnpm infra:up
pnpm --filter @tplab/api test
```

Manual: executar uma simulacao completa pela interface; tentar, de dentro do
worker, uma operacao que o proxy deve recusar.

## Riscos

- O proxy pode bloquear uma chamada que o `dockerode` faz sem ser obvia (por
  exemplo, inspecao antes de criar); testar o fluxo inteiro apos a mudanca, nao
  so a criacao.
- Um proxy mal configurado da falsa sensacao de seguranca: se ele permitir criar
  container com `Binds` arbitrarios, o ganho e nulo. A verificacao das operacoes
  recusadas e obrigatoria.
- Se a decisao for manter o socket exposto, isso precisa aparecer no texto do TCC
  como limitacao conhecida, nao ficar so no codigo.
