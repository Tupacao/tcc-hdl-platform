# RF10-I01 - Seletor de tema com os tres modos

| Campo | Valor |
| --- | --- |
| Feature | [RF10](feature.md) |
| Branch | `feat/rf10-seletor-tres-modos` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`theme-provider.tsx` modela tres estados (`light`, `dark`, `system`), persiste a
escolha e resolve `system` observando `prefers-color-scheme` com um listener
ativo. Toda a logica esta pronta.

`theme-toggle.tsx`, porem, e um botao que so alterna entre os dois extremos:

```tsx
const next = resolvedTheme === 'dark' ? 'light' : 'dark';
```

Consequencia pratica: o usuario abre a aplicacao em `system`, clica uma vez e
perde o modo automatico para sempre - nao ha caminho de volta pela interface. A
capacidade existe no codigo e nao existe no produto.

## Objetivo

Expor os tres modos na interface, deixando visivel qual esta ativo e permitindo
voltar a "sistema".

## Escopo tecnico

- `apps/web/src/components/theme-toggle.tsx`
- `apps/web/src/components/ui/dropdown-menu.tsx` (adicionar via shadcn/ui)
- `apps/web/src/components/theme-provider.tsx` - sem mudanca funcional prevista

## Passo a passo

1. Adicionar o `dropdown-menu` do shadcn/ui (style `new-york`, conforme
   `components.json`), se ainda nao existir em `components/ui/`.
2. Trocar o botao por um menu com tres itens - Claro, Escuro, Sistema - usando
   `DropdownMenuRadioGroup` para que o estado ativo seja comunicado
   semanticamente, e nao apenas por marca visual.
3. Escolher o icone do gatilho pelo `resolvedTheme` (sol/lua) e indicar o modo
   "sistema" no proprio item do menu, evitando um terceiro icone ambiguo no
   cabecalho.
4. Ajustar o `aria-label` do gatilho: hoje ele anuncia a acao ("Ativar modo
   escuro"), o que deixa de fazer sentido quando o controle abre um menu.
   Anunciar o estado atual ("Tema: sistema").
5. Confirmar que a preferencia continua persistida em `localStorage` sob
   `tplab-theme` e que "sistema" tambem e gravado - senao a proxima sessao volta
   ao default.
6. Verificar, com o modo "sistema" ativo, que mudar a preferencia do sistema
   operacional troca o tema sem recarregar (o listener ja existe).
7. Conferir foco visivel, navegacao por teclado e fechamento por `Esc` (o Radix
   entrega, mas precisa ser validado no contexto do cabecalho).

## Criterios de aceite

- [ ] O menu oferece Claro, Escuro e Sistema, com o ativo marcado.
- [ ] Escolher "Sistema" volta a seguir a preferencia do SO imediatamente.
- [ ] A escolha sobrevive a recarga da pagina.
- [ ] O leitor de tela anuncia o modo ativo e a lista de opcoes.
- [ ] Operavel apenas por teclado, com foco visivel.
- [ ] O tema do editor Monaco acompanha os tres modos.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: com "Sistema" ativo, alternar o tema do Windows e observar a aplicacao
mudar sem recarregar.

## Riscos

- Trocar o botao por menu aumenta o numero de cliques para a acao mais comum
  (alternar claro/escuro). Se o design preferir, manter o clique direto
  alternando e o menu no clique longo ou em um item separado - decisao que
  pertence ao Figma de RF10.
