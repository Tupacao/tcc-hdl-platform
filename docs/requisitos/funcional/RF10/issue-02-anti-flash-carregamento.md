# RF10-I02 - Aplicar o tema antes da primeira pintura

| Campo | Valor |
| --- | --- |
| Feature | [RF10](feature.md) |
| Branch | `feat/rf10-anti-flash-carregamento` |
| Tamanho | P (aprox. 0,5 dia) |
| Depende de | - |

## Contexto

`apps/web/index.html` fixa `<html lang="pt-BR" class="dark">`. A classe correta
so e aplicada depois que o React monta e o `useEffect` do `ThemeProvider` roda.
Entre a primeira pintura e esse efeito, quem escolheu tema claro ve a tela
escura por alguns quadros - e o inverso nao acontece so por sorte, porque o
padrao do HTML e escuro.

Com o bundle do Monaco isolado em chunk proprio (`vite.config.ts`), o intervalo
ate a hidratacao nao e desprezivel, especialmente em rede de laboratorio.

## Objetivo

Garantir que a primeira pintura ja aconteca no tema correto, nos tres modos.

## Escopo tecnico

- `apps/web/index.html` - script sincrono no `<head>`
- `apps/web/src/components/theme-provider.tsx` - alinhar o estado inicial
- `apps/web/src/index.css` - `color-scheme` no CSS base

## Passo a passo

1. Inserir no `<head>` de `index.html` um script sincrono, antes de qualquer
   folha de estilo ou modulo, que:
   - le `localStorage.getItem('tplab-theme')` dentro de `try/catch`;
   - resolve `system` (ou valor ausente) com
     `matchMedia('(prefers-color-scheme: dark)').matches`;
   - aplica ou remove a classe `dark` em `document.documentElement` e define
     `style.colorScheme`.
2. Remover a classe `dark` fixa do `<html>`: com o script, ela passa a ser
   decidida em tempo de carregamento.
3. Manter a chave `tplab-theme` em um so lugar conceitual. Como o script inline
   nao pode importar do bundle, deixar comentario nos dois arquivos apontando um
   para o outro - se `STORAGE_KEY` mudar em `theme-provider.tsx` sem mudar aqui, o
   flash volta silenciosamente.
4. Fazer o `ThemeProvider` derivar o estado inicial do que o script ja aplicou,
   para nao haver uma segunda troca de classe logo apos a montagem.
5. Definir `color-scheme` tambem no CSS base, para que os controles nativos
   (barra de rolagem, campos) nascam com a aparencia correta.
6. Verificar que o script inline nao quebra a politica de CSP definida quando o
   frontend for publicado (RF01-I02): se a CSP proibir script inline, sera
   preciso `nonce` ou hash - decidir junto com o deploy.
7. Medir o resultado carregando com cache desabilitado e rede lenta simulada.

## Criterios de aceite

- [ ] Com tema claro escolhido, o carregamento nao mostra nenhum quadro escuro.
- [ ] Com "sistema" e SO em modo claro, idem.
- [ ] Nao ha segunda troca de classe apos a montagem do React.
- [ ] Barra de rolagem e controles nativos nascem no tema correto.
- [ ] `localStorage` indisponivel nao quebra o carregamento.
- [ ] O script tem menos de 20 linhas e nenhuma dependencia.

## Verificacao

```bash
pnpm --filter @tplab/web build
pnpm --filter @tplab/web preview
```

Manual: no DevTools, desabilitar cache, limitar a rede a "Slow 3G", recarregar e
gravar. Repetir nos tres modos.

## Riscos

- Script inline duplica logica do `ThemeProvider`; e o custo aceito para eliminar
  o flash, e a duplicacao precisa estar comentada nos dois lados.
- CSP restritiva em producao bloqueia o script; alinhar com RF01-I02 antes do
  deploy para nao descobrir isso so em producao.
