# RNF02-I01 - Declaracao do alvo de build e navegadores suportados

| Campo | Valor |
| --- | --- |
| Feature | [RNF02](feature.md) |
| Branch | `chore/rnf02-alvo-de-build-e-suporte` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`apps/web/vite.config.ts` configura plugins, alias, `manualChunks` para o Monaco
e o proxy de desenvolvimento - mas nao declara `build.target`. Vale o padrao do
Vite, que e razoavel, mas implicito: ninguem no projeto sabe hoje qual e o piso
de compatibilidade, e nao ha como afirmar em uma revisao se um recurso novo pode
ser usado.

"Compativel com versoes recentes" tambem precisa virar numero. Sem isso, o
criterio de aceite de RNF02 nao e verificavel.

## Objetivo

Declarar explicitamente os navegadores suportados, alinhar o build a essa
declaracao e avisar quem estiver fora dela.

## Escopo tecnico

- `apps/web/vite.config.ts` - `build.target`
- `apps/web/package.json` - `browserslist`, se adotado
- `README.md` - secao de compatibilidade
- `apps/web/src/lib/browser-support.ts` (novo) - deteccao

## Passo a passo

1. Definir o alvo em versoes concretas: as duas ultimas versoes maiores de
   Chrome, Firefox, Edge e Safari, com os numeros escritos no `README.md` e a
   data da decisao - "duas ultimas" envelhece sozinho.
2. Configurar `build.target` no Vite com os valores correspondentes
   (por exemplo `['chrome120', 'firefox120', 'edge120', 'safari17']`, ajustando
   aos numeros reais na data da issue).
3. Avaliar se `browserslist` acrescenta algo. Como o projeto nao usa PostCSS com
   autoprefixer (Tailwind v4 cuida do CSS por conta propria), provavelmente basta
   o alvo do Vite - registrar a conclusao.
4. Implementar deteccao por capacidade, nao por user agent: verificar as APIs
   efetivamente usadas (Web Worker, `matchMedia`, `ResizeObserver`, canvas 2D,
   `structuredClone`). Detectar por user agent quebra a cada mudanca de string.
5. Exibir o aviso de navegador nao suportado conforme o design: informativo,
   dispensavel, sem bloquear o uso.
6. Registrar no `README.md` o alvo, o motivo e como reavaliar, para que a decisao
   nao vire folclore.
7. Conferir que o build com o alvo declarado continua funcionando e que o tamanho
   do bundle nao muda de forma relevante.

## Criterios de aceite

- [ ] O `README.md` lista os navegadores e versoes suportados, com data.
- [ ] `build.target` corresponde a essa lista.
- [ ] A deteccao e por capacidade, nao por user agent.
- [ ] O aviso aparece em navegador sem as APIs necessarias e nao bloqueia o uso.
- [ ] O build continua funcionando e o tamanho do bundle esta registrado.
- [ ] A decisao e o criterio de reavaliacao estao documentados.

## Verificacao

```bash
pnpm --filter @tplab/web build
pnpm typecheck
```

Manual: simular a ausencia de uma API no console e conferir que o aviso aparece.

## Riscos

- Alvo antigo demais infla o bundle com transpilacao desnecessaria; alvo novo
  demais quebra em maquina de laboratorio que nao atualiza. A escolha precisa
  considerar o parque real da instituicao.
- Deteccao por capacidade que testa a API errada gera falso alarme; testar apenas
  o que o codigo realmente usa.
