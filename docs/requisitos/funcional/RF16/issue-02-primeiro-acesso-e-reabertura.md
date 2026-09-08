# RF16-I02 - Controle de primeiro acesso e reabertura

| Campo | Valor |
| --- | --- |
| Feature | [RF16](feature.md) |
| Branch | `feat/rf16-primeiro-acesso-e-reabertura` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | RF16-I01 |

## Contexto

Com o tour implementado, falta decidir **quando** ele aparece. Um tour que roda a
cada visita e o tipo de detalhe que faz o usuario evitar a ferramenta. Um tour
que roda uma vez e nunca mais tambem falha, porque quem pulou apressado nao tem
como voltar.

O padrao ja existe no projeto: `ThemeProvider` guarda a preferencia em
`localStorage` sob `tplab-theme`, com `try/catch` para o caso de a API estar
indisponivel.

## Objetivo

Rodar o tour uma unica vez, de forma automatica, e oferecer um caminho explicito
para reabri-lo.

## Escopo tecnico

- `apps/web/src/features/tour/use-tour.ts` - estado de "ja visto"
- `apps/web/src/features/workspace/workspace-header.tsx` - acao de reabrir
- `apps/web/src/features/docs/` - link a partir da documentacao

## Passo a passo

1. Guardar a conclusao em `localStorage` sob `tplab-tour-seen`, com valor
   versionado (por exemplo `v1`), para permitir reexibir quando o tour mudar de
   forma relevante em uma versao futura.
2. Envolver leitura e escrita em `try/catch`, seguindo o padrao do
   `ThemeProvider`: sem `localStorage`, o tour roda toda vez em vez de quebrar - e
   a degradacao aceitavel.
3. Marcar como visto tanto ao concluir quanto ao pular. Pular e uma decisao do
   usuario, nao um acidente.
4. Adicionar a acao "Ver tour novamente" em um lugar previsivel - menu de ajuda
   no cabecalho e, tambem, no fim do guia de inicio rapido de RF11.
5. Nao iniciar automaticamente quando o usuario chega por um link compartilhado
   (RF15) ou por um link direto para a documentacao: nesses casos ha uma
   intencao especifica, e o tour atrapalha.
6. Quando RF14 existir, considerar guardar a preferencia tambem no perfil, para
   que o tour nao reapareca em outra maquina. Nao implementar agora - registrar
   como melhoria.
7. Testar em janela privativa e com armazenamento bloqueado.

## Criterios de aceite

- [ ] O tour inicia sozinho no primeiro acesso.
- [ ] Concluir ou pular impede a reexibicao automatica.
- [ ] Existe acao visivel para reabrir o tour, e ela funciona.
- [ ] Com `localStorage` indisponivel, a aplicacao funciona normalmente.
- [ ] O tour nao inicia sozinho ao abrir um link compartilhado.
- [ ] A chave e versionada.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: primeiro acesso em janela privativa; recarregar e confirmar que nao
reaparece; reabrir pela acao; abrir um link compartilhado e confirmar que o tour
nao inicia.

## Riscos

- Limpar dados do navegador reexibe o tour; comportamento aceitavel e esperado.
- Guardar a preferencia so no servidor exigiria login e contrariaria o acesso
  anonimo de RF01; `localStorage` e a escolha correta para o MVP.
