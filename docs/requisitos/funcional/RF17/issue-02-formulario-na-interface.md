# RF17-I02 - Formulario de feedback na interface

| Campo | Valor |
| --- | --- |
| Feature | [RF17](feature.md) |
| Branch | `feat/rf17-formulario-na-interface` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF17-I01 |

## Contexto

Com o endpoint pronto, falta o caminho ate ele. Duas decisoes importam mais que a
implementacao:

1. **Onde fica.** O feedback precisa ser alcancavel sempre, sem competir com o
   botao "Executar", que e a acao principal da tela.
2. **O que vai junto.** Anexar contexto tecnico automaticamente e o que torna o
   relato util, e precisa ser visivel para quem envia - transparencia, nao letra
   miuda.

## Objetivo

Entregar um formulario curto, acessivel de qualquer tela, que envie o feedback
com contexto tecnico declarado.

## Escopo tecnico

- `apps/web/src/features/feedback/feedback-dialog.tsx` (novo)
- `apps/web/src/features/feedback/collect-context.ts` (novo)
- `apps/web/src/lib/api.ts` - funcao de envio
- `apps/web/src/features/workspace/workspace-header.tsx` - ponto de acesso

## Passo a passo

1. Adicionar o ponto de acesso no lugar definido pelo design, com rotulo textual
   e nao apenas icone.
2. Montar o dialogo com os campos de `FeedbackSchema`: tipo (grupo de opcoes),
   mensagem (area de texto com contador de caracteres) e contato opcional.
3. Validar no cliente com o mesmo schema do backend, importado de
   `@tplab/shared` - sem regra duplicada.
4. Coletar o contexto tecnico: `navigator.userAgent`, dimensoes da janela, o
   `failure` da ultima simulacao e o `projectId` aberto. Nada mais - nao coletar
   o codigo do usuario.
5. Mostrar o contexto em um bloco expansivel, com o conteudo exato que sera
   enviado, e permitir enviar sem ele.
6. Estados de envio: enviando (botao desabilitado), sucesso (toast com `sonner` e
   fechamento do dialogo), erro de validacao (mensagem no campo), `429` (aviso de
   limite atingido, com o tempo de espera).
7. Acessibilidade: dialogo com foco preso e retorno de foco, rotulos associados
   aos campos, erro anunciado, `Esc` fecha sem enviar. O Radix cobre boa parte;
   validar mesmo assim.
8. Preservar o texto digitado se o envio falhar - perder o relato inteiro por um
   erro de rede e a pior falha possivel nesta tela.

## Criterios de aceite

- [ ] O feedback e acessivel de qualquer tela.
- [ ] O formulario valida com o mesmo schema do backend.
- [ ] O contexto tecnico e visivel antes do envio e pode ser omitido.
- [ ] O codigo do usuario nunca e enviado.
- [ ] O sucesso e confirmado e o dialogo fecha.
- [ ] Erro de envio preserva o texto digitado.
- [ ] O limite de envios mostra mensagem propria.
- [ ] O dialogo e operavel por teclado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: enviar cada tipo de feedback; forcar erro derrubando a API e conferir que
o texto permanece; estourar o limite e conferir a mensagem.

## Riscos

- Coletar contexto demais transforma um formulario simples em coleta de dados;
  manter a lista curta e visivel.
- Um botao flutuante permanente atrapalha o canvas de RF12 e o painel de ondas;
  a posicao precisa ser validada com aquelas telas, nao so com o workspace atual.
